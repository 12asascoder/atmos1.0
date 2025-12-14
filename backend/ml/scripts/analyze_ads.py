import json
import subprocess
import os
import imageio_ffmpeg

# Force Whisper to use the bundled ffmpeg from imageio
os.environ["FFMPEG_BINARY"] = imageio_ffmpeg.get_ffmpeg_exe()
import subprocess
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Dict, Any

import cv2
import numpy as np
from moviepy.editor import VideoFileClip
from PIL import Image
from sklearn.cluster import KMeans
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector
import whisper

# ===========================
# Config
# ===========================

# This file should live in: backend/ml/scripts/analyze_ads.py
SCRIPT_DIR = Path(__file__).resolve().parent               # .../backend/ml/scripts
ML_DIR = SCRIPT_DIR.parent                                 # .../backend/ml
DATA_DIR = ML_DIR / "data"                                 # .../backend/ml/data
RAW_VIDEO_DIR = DATA_DIR / "raw_videos"                    # .../backend/ml/data/raw_videos
ANALYSIS_DIR = DATA_DIR / "analysis"                       # .../backend/ml/data/analysis

RAW_VIDEO_DIR.mkdir(exist_ok=True, parents=True)
ANALYSIS_DIR.mkdir(exist_ok=True, parents=True)

# Hardcode your JSON now; later you can parametrize or auto-detect latest
ADS_JSON_PATH = DATA_DIR / "ads_general_US_20251210_164809.json"

# Whisper model: "tiny", "base", "small", "medium", "large"
WHISPER_MODEL_NAME = "small"


# ===========================
# Utilities
# ===========================

def load_ads(json_path: Path) -> List[Dict[str, Any]]:
    """Load ads list from the JSON file created by your fetch script."""
    with open(json_path, "r", encoding="utf-8") as f:
        ads = json.load(f)
    print(f"[INFO] Loaded {len(ads)} ads from {json_path}")
    return ads


def get_video_url_from_snapshot(snapshot_url: str) -> str | None:
    """
    Given a Meta ad_snapshot_url (HTML render page), try to find the actual video URL.
    Returns a direct video URL (likely .mp4) or None if not found.
    """
    print(f"[INFO] Resolving media URL from snapshot: {snapshot_url}")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    resp = requests.get(snapshot_url, headers=headers)
    resp.raise_for_status()

    content_type = resp.headers.get("Content-Type", "")
    # In some rare cases, snapshot_url might already be a direct video
    if content_type.startswith("video"):
        print("[INFO] Snapshot URL is already a video stream.")
        return snapshot_url

    # Otherwise, it's HTML
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")

    # Try <video> and <source> tags first
    for tag in soup.find_all(["video", "source"]):
        src = tag.get("src") or tag.get("data-src")
        if src and ".mp4" in src:
            video_url = urljoin(snapshot_url, src)
            print(f"[INFO] Found video src in HTML: {video_url}")
            return video_url

    # Fallback: sometimes FB uses <img> for animated things; we skip those for now
    print("[WARN] Could not find a video URL inside snapshot HTML.")
    return None


def download_video(ad: Dict[str, Any]) -> Path:
    """
    Download ad video by:
    - Resolving the real video URL from snapshot_url HTML
    - Saving it under raw_videos/<ad_id>.mp4

    If an existing file is invalid (HTML, corrupt, zero duration), it will be deleted and re-downloaded.
    """
    ad_id = ad["ad_id"]
    snapshot_url = ad["snapshot_url"]
    out_path = RAW_VIDEO_DIR / f"{ad_id}.mp4"

    # If file exists, check if it's a valid video (non-zero duration).
    if out_path.exists():
        try:
            clip = VideoFileClip(str(out_path))
            duration = clip.duration
            clip.close()
            if duration and duration > 0:
                print(f"[SKIP] Video already downloaded for ad {ad_id}: {out_path} (duration={duration:.2f}s)")
                return out_path
            else:
                print(f"[WARN] Existing video has zero duration, re-downloading: {out_path}")
        except Exception:
            print(f"[WARN] Existing video file is invalid or not a real video, re-downloading: {out_path}")

        # Delete bad file
        try:
            out_path.unlink()
        except OSError:
            print(f"[WARN] Could not delete invalid file: {out_path}")

    # Resolve the actual video URL from the snapshot HTML
    video_url = get_video_url_from_snapshot(snapshot_url)
    if not video_url:
        raise RuntimeError(f"Could not find a video URL inside snapshot for ad {ad_id}")

    print(f"[INFO] Downloading video for ad {ad_id} from {video_url}")
    resp = requests.get(video_url, stream=True)
    resp.raise_for_status()

    with open(out_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

    print(f"[OK] Saved video to {out_path}")
    return out_path



def extract_audio(video_path: Path) -> Path:
    """
    Extract audio using MoviePy (no direct ffmpeg subprocess call).
    Returns path to WAV file (16kHz, mono).
    """
    audio_path = video_path.with_suffix(".wav")
    if audio_path.exists():
        print(f"[SKIP] Audio already extracted: {audio_path}")
        return audio_path

    print(f"[INFO] Extracting audio using MoviePy: {video_path.name}")
    clip = VideoFileClip(str(video_path))

    if clip.audio is None:
        clip.close()
        raise RuntimeError("No audio track found in this video.")

    clip.audio.write_audiofile(
        str(audio_path),
        fps=16000,
        nbytes=2,
        codec="pcm_s16le",
    )
    clip.close()

    print(f"[OK] Audio extracted to {audio_path}")
    return audio_path

import soundfile as sf
import numpy as np

def transcribe_audio_whisper(audio_path: Path, model) -> Dict[str, Any]:
    """
    Read WAV directly with soundfile and pass raw audio array to Whisper.
    This avoids Whisper calling ffmpeg on Windows.
    """
    print(f"[INFO] Transcribing audio with Whisper (direct WAV): {audio_path.name}")

    # Read WAV file
    data, sr = sf.read(str(audio_path), dtype="float32")

    # If stereo, convert to mono
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)

    target_sr = 16000

    # Resample if needed
    if sr != target_sr:
        try:
            import resampy
            data = resampy.resample(data, sr, target_sr)
        except Exception:
            raise RuntimeError(
                f"Audio is {sr}Hz but Whisper needs 16000Hz. "
                "Install resampy or scipy for resampling."
            )

    # Transcribe from raw numpy array (no ffmpeg subprocess)
    result = model.transcribe(data, word_timestamps=True)
    return result



def detect_scenes(video_path: Path, threshold: float = 27.0) -> List[Dict[str, float]]:
    """Use PySceneDetect to detect scene cuts; returns list of dicts with start/end in seconds."""
    print(f"[INFO] Detecting scenes for {video_path.name}")
    video_manager = VideoManager([str(video_path)])
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=threshold))

    video_manager.start()
    scene_manager.detect_scenes(frame_source=video_manager)
    scene_list = scene_manager.get_scene_list()
    video_manager.release()

    scenes = []
    for start_time, end_time in scene_list:
        scenes.append({
            "start_sec": start_time.get_seconds(),
            "end_sec": end_time.get_seconds()
        })

    print(f"[OK] Detected {len(scenes)} scenes")
    return scenes


def sample_frames(video_path: Path, num_frames: int = 5) -> List[Image.Image]:
    """
    Sample a few frames evenly across the video using OpenCV and return as PIL Images.
    """
    print(f"[INFO] Sampling {num_frames} frames from {video_path.name}")
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count == 0:
        cap.release()
        return []

    indices = np.linspace(0, frame_count - 1, num_frames, dtype=int)
    frames = []

    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret:
            continue
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(frame_rgb)
        frames.append(pil_img)

    cap.release()
    print(f"[OK] Sampled {len(frames)} frames")
    return frames


def extract_palette_from_image(image: Image.Image, k: int = 4) -> List[Dict[str, float]]:
    """
    Extract dominant colors from a single image using KMeans, return list of {hex, ratio}.
    """
    img = image.resize((256, 256))
    data = np.array(img).reshape(-1, 3)

    # KMeans can be a bit slow; keep k small and n_init small for speed.
    kmeans = KMeans(n_clusters=k, n_init=3, random_state=42)
    kmeans.fit(data)

    centers = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_

    counts = np.bincount(labels)
    total = len(labels)

    palette = []
    for center, count in zip(centers, counts):
        r, g, b = center
        ratio = float(count) / float(total)
        hex_code = "#{:02X}{:02X}{:02X}".format(r, g, b)
        palette.append({"hex": hex_code, "ratio": ratio})

    palette.sort(key=lambda x: x["ratio"], reverse=True)
    return palette


def extract_palette_from_frames(frames: List[Image.Image], k: int = 4) -> List[Dict[str, float]]:
    """
    Compute a global palette across multiple frames by concatenating pixels.
    """
    if not frames:
        return []

    # Stack all frames into one big array (downsampled)
    pixels_list = []
    for img in frames:
        img_small = img.resize((128, 128))
        pixels_list.append(np.array(img_small).reshape(-1, 3))

    all_pixels = np.vstack(pixels_list)

    kmeans = KMeans(n_clusters=k, n_init=3, random_state=42)
    kmeans.fit(all_pixels)

    centers = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_

    counts = np.bincount(labels)
    total = len(labels)

    palette = []
    for center, count in zip(centers, counts):
        r, g, b = center
        ratio = float(count) / float(total)
        hex_code = "#{:02X}{:02X}{:02X}".format(r, g, b)
        palette.append({"hex": hex_code, "ratio": ratio})

    palette.sort(key=lambda x: x["ratio"], reverse=True)
    return palette


def analyse_single_ad(ad: Dict[str, Any], whisper_model) -> Dict[str, Any]:
    """
    Full analysis pipeline for one ad:
      - download video
      - extract audio + transcript
      - detect scenes
      - sample frames + color palette

    Returns a dict ready to be saved as JSON (raw features for now).
    """
    ad_id = ad.get("ad_id")
    page_name = ad.get("page_name")
    snapshot_url = ad.get("snapshot_url")

    print("\n" + "=" * 60)
    print(f"[AD] {ad_id} | {page_name}")
    print("=" * 60)

    # 1. Download video (or reuse existing)
    video_path = download_video(ad)

    # 2. Extract audio & transcribe
    audio_path = extract_audio(video_path)
    transcript_result = transcribe_audio_whisper(audio_path, whisper_model)

    # 3. Detect scenes
    scenes = detect_scenes(video_path)

    # 4. Sample frames & extract palette
    frames = sample_frames(video_path, num_frames=5)
    palette = extract_palette_from_frames(frames, k=4)

    # 5. Build analysis dict (raw data; LLM scoring can be separate step)
    analysis = {
        "ad_id": ad_id,
        "page_id": ad.get("page_id"),
        "page_name": page_name,
        "snapshot_url": snapshot_url,
        "start_time": ad.get("start_time"),
        "stop_time": ad.get("stop_time"),
        "video_path": str(video_path),
        "audio_path": str(audio_path),

        "transcript": {
            "text": transcript_result.get("text", ""),
            "segments": [
                {
                    "start": seg.get("start"),
                    "end": seg.get("end"),
                    "text": seg.get("text", "").strip()
                }
                for seg in transcript_result.get("segments", [])
            ],
        },

        "scenes": scenes,

        "color_palette": palette,
    }

    return analysis


def save_analysis(ad_id: str, analysis: Dict[str, Any]) -> Path:
    """Save analysis JSON to analysis/<ad_id>_analysis.json."""
    out_path = ANALYSIS_DIR / f"{ad_id}_analysis.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"[OK] Saved analysis for ad {ad_id} to {out_path}")
    return out_path


# ===========================
# Main
# ===========================

def main():
    # Load ads
    ads = load_ads(ADS_JSON_PATH)

    # Load Whisper once (important for speed)
    print(f"[INFO] Loading Whisper model: {WHISPER_MODEL_NAME}")
    whisper_model = whisper.load_model(WHISPER_MODEL_NAME)

    # ================================
    # Process ONLY FIRST 3 ADS
    # ================================
    print("[INFO] Running in TEST MODE – processing only the first 3 ads.\n")
    ads_to_process = ads[:3]

    for ad in ads_to_process:
        try:
            analysis = analyse_single_ad(ad, whisper_model)
            save_analysis(ad["ad_id"], analysis)
        except Exception as e:
            print(f"[ERROR] Failed to process ad {ad.get('ad_id')}: {e}")



if __name__ == "__main__":
    main()
