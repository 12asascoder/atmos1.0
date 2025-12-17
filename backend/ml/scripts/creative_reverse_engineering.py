#!/usr/bin/env python3
"""
generate_creative_report_toon.py
Reads per-ad analysis stored as TOON files (analysis/_analysis.toon),
decodes them using python-toon (for internal use), but supplies the raw
TOON string directly to the LLM (prompt tells the model it's TOON).
Also supplies a small JSON summary for robustness.
Writes a JSON creative report to ml/data/reports/_report.json.
"""
import os
import json
import time
import re
from pathlib import Path
from typing import Dict, Any, List
from tqdm import tqdm
from dotenv import load_dotenv

# try to import openai
try:
    import openai
except Exception:
    openai = None

# python-toon decoder
try:
    from toon import decode
except Exception:
    decode = None

# ------------------ Load .env ------------------
load_dotenv()

# ---------- CONFIG ----------
SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent
DATA_DIR = ML_DIR / "data"
ANALYSIS_DIR = DATA_DIR / "analysis"
REPORT_DIR = DATA_DIR / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

if openai and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# --------------------------
# Utils
# --------------------------
def _words(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"[a-zA-Z0-9']+", text)]


# --------------------------
# Extract ad_id from filename
# --------------------------
def extract_ad_id_from_filename(path: Path) -> str:
    """Extract ad_id from filename like 'ad123_analysis.toon' -> 'ad123'"""
    stem = path.stem  # removes extension
    # Remove '_analysis' suffix if present
    if stem.endswith('_analysis'):
        stem = stem[:-9]
    return stem


# --------------------------
# Compact JSON summary
# --------------------------
def summary_from_raw(raw: Dict[str, Any], ad_id: str, max_transcript_chars: int = 2000) -> Dict[str, Any]:
    transcript = raw.get("transcript", {}) or {}
    text = transcript.get("text", "") or ""
    if len(text) > max_transcript_chars:
        text = (
            text[: max_transcript_chars // 2]
            + "\n\n...[truncated]...\n\n"
            + text[-max_transcript_chars // 2 :]
        )

    segments = transcript.get("segments", []) or []
    scenes = raw.get("scenes", []) or []
    palette = raw.get("color_palette", []) or []

    return {
        "ad_id": ad_id,  # Use the extracted ad_id
        "transcript_text": text,
        "transcript_segments_preview": [
            {"start": s.get("start"), "end": s.get("end"), "text": (s.get("text") or "")[:200]}
            for s in segments[:10]
        ],
        "scenes_preview": [
            {"start_sec": s.get("start_sec"), "end_sec": s.get("end_sec")}
            for s in scenes[:20]
        ],
        "color_palette": palette[:6],
        "video_path": raw.get("video_path"),
        "audio_path": raw.get("audio_path"),
    }


# --------------------------
# Viewer age estimation
# --------------------------
def estimate_viewer_age_from_raw(raw: Dict[str, Any]) -> Dict[str, Any]:
    transcript = raw.get("transcript", {}) or {}
    text = transcript.get("text", "") or ""
    words = _words(text)

    scenes = raw.get("scenes", []) or []
    scene_count = len(scenes)
    duration = scenes[-1].get("end_sec", 0.0) if scenes else 0.0
    avg_scene = duration / scene_count if scene_count else 0.0
    unique_ratio = len(set(words)) / max(1, len(words))

    youth_terms = ["new", "now", "fast", "win", "challenge", "trending"]
    professional_terms = ["career", "growth", "future", "secure", "invest"]
    family_terms = ["family", "home", "children", "care", "support"]
    senior_terms = ["retirement", "healthcare", "pension", "safety"]

    scores = {"youth": 0, "professional": 0, "family": 0, "senior": 0}

    for w in words:
        if any(t in w for t in youth_terms):
            scores["youth"] += 1
        if any(t in w for t in professional_terms):
            scores["professional"] += 1
        if any(t in w for t in family_terms):
            scores["family"] += 1
        if any(t in w for t in senior_terms):
            scores["senior"] += 1

    if avg_scene < 2.5:
        scores["youth"] += 3
    if unique_ratio > 0.55:
        scores["professional"] += 2
    if unique_ratio < 0.4:
        scores["youth"] += 1

    dominant = max(scores, key=scores.get)

    if dominant == "youth":
        age = (18, 30)
        reason = "Fast pacing, urgency cues, and simple language."
    elif dominant == "professional":
        age = (25, 40)
        reason = "Higher vocabulary diversity and future-oriented framing."
    elif dominant == "family":
        age = (30, 50)
        reason = "Family and stability-focused messaging."
    else:
        age = (45, 65)
        reason = "Security, healthcare, or long-term safety emphasis."

    confidence = min(95, 40 + scores[dominant] * 10)

    return {
        "min": age[0],
        "max": age[1],
        "confidence": confidence,
        "reason": reason,
    }


# --------------------------
# Prompt builder
# --------------------------
def build_prompt_for_analysis_from_toon(toon_str: str, raw_summary: Dict[str, Any]) -> str:
    summary_json = json.dumps(raw_summary, indent=2, ensure_ascii=False)
    return f"""
You are an expert ad creative analyst. The input is provided in TOON format.
If you understand TOON, decode it. Otherwise, rely on the JSON summary.

--- TOON INPUT ---
{toon_str}
--- END TOON ---

--- JSON SUMMARY ---
{summary_json}
--- END SUMMARY ---

Return EXACTLY ONE JSON object matching the required schema. No markdown. No text outside JSON.
IMPORTANT: Include the "ad_id" field with value "{raw_summary['ad_id']}" in your response.
"""


# --------------------------
# OpenAI call
# --------------------------
def openai_completion_with_retries(prompt: str, ad_id: str) -> Dict[str, Any]:
    for attempt in range(1, 3):
        try:
            resp = openai.ChatCompletion.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Return only valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1400,
                temperature=0.2,
            )
            result = json.loads(resp["choices"][0]["message"]["content"])
            # Ensure ad_id is set
            if not result.get("ad_id"):
                result["ad_id"] = ad_id
            return result
        except Exception as e:
            print(f"[WARN] OpenAI attempt {attempt} failed: {e}")
            time.sleep(5 * attempt)
    raise RuntimeError("OpenAI failed after retries")


# --------------------------
# Deterministic fallback
# --------------------------
def generate_report_from_raw(raw: Dict[str, Any], ad_id: str) -> Dict[str, Any]:
    transcript = raw.get("transcript", {}) or {}
    segments = transcript.get("segments", []) or []
    text = transcript.get("text", "") or ""
    words = _words(text)
    total_words = max(1, len(words))

    scenes = raw.get("scenes", []) or []
    scene_count = len(scenes)
    duration = scenes[-1].get("end_sec", 0.0) if scenes else 0.0
    avg_scene = duration / scene_count if scene_count else 0.0

    opening = segments[0] if segments else {}
    hook_text = opening.get("text", "") or ""
    strength_score = max(20, min(95, 80 - len(_words(hook_text)) * 2))

    unique_ratio = len(set(words)) / total_words
    copy_quality_score = int(min(100, 40 + unique_ratio * 80))

    palette = raw.get("color_palette", []) or []
    primary_colors = [p.get("hex") for p in palette[:3] if p.get("hex")]

    viewer_age_estimate = estimate_viewer_age_from_raw(raw)

    return {
        "ad_id": ad_id,  # Use the passed ad_id
        "headline": None,
        "opening_hook": {
            "text": hook_text or None,
            "start_sec": opening.get("start"),
            "end_sec": opening.get("end"),
            "strength_score": strength_score,
            "reason": "Short, direct opening." if hook_text else "No clear hook.",
        },
        "value_propositions": [],
        "cta": {
            "text": None,
            "start_sec": None,
            "clarity_score": 30,
            "urgency_score": 20,
            "placement": "late",
        },
        "emotional_triggers": {
            "excitement": 40,
            "trust": 50,
            "urgency": 35,
            "curiosity": 30,
            "desire": 40,
            "fear": 20,
            "hope": 45,
        },
        "visual_analysis": {
            "primary_colors": primary_colors,
            "mood": "neutral",
            "visual_impact_score": 60,
        },
        "pacing": {
            "scene_count": scene_count,
            "avg_scene_duration": round(avg_scene, 2),
            "hook_speed_sec": opening.get("end"),
            "pacing_score": 65,
        },
        "brand_archetype": {"type": "Unknown", "score": 50},
        "copy_quality_score": copy_quality_score,
        "overall_score": int((strength_score + copy_quality_score) / 2),
        "viewer_age_estimate": viewer_age_estimate,
        "explanation_notes": [
            "Fallback heuristic used.",
            f"Estimated audience age: {viewer_age_estimate['min']}–{viewer_age_estimate['max']}.",
        ],
    }


# --------------------------
# Analyze file
# --------------------------
def analyze_file(path: Path):
    # Extract ad_id from filename
    ad_id = extract_ad_id_from_filename(path)
    
    raw = None
    toon_str = None

    if path.suffix == ".toon":
        toon_str = path.read_text(encoding="utf-8")
        if decode:
            try:
                raw = decode(toon_str)
            except Exception as e:
                print(f"[WARN] TOON decode failed for {path.name}: {e}")

    if raw is None:
        # Try reading as JSON
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[ERROR] Cannot parse {path.name}: {e}")
            return

    if toon_str is None:
        toon_str = json.dumps(raw)

    summary = summary_from_raw(raw, ad_id)
    prompt = build_prompt_for_analysis_from_toon(toon_str, summary)

    report = None
    if openai and OPENAI_API_KEY:
        try:
            report = openai_completion_with_retries(prompt, ad_id)
        except Exception as e:
            print(f"[WARN] OpenAI failed for {ad_id}: {e}")
            report = None

    if report is None:
        report = generate_report_from_raw(raw, ad_id)

    # Use ad_id from report (guaranteed to exist now)
    out = REPORT_DIR / f"{report['ad_id']}_report.json"
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] Saved {out.name}")


# --------------------------
# Batch runner
# --------------------------
def main():
    files = list(ANALYSIS_DIR.glob("*_analysis.toon"))
    if not files:
        files = list(ANALYSIS_DIR.glob("*_analysis.json"))
    
    if not files:
        print("[ERROR] No analysis files found in", ANALYSIS_DIR)
        return

    print(f"Found {len(files)} files to process")
    
    for f in tqdm(files, desc="Generating reports"):
        try:
            analyze_file(f)
        except Exception as e:
            print(f"[ERROR] {f.name}: {e}")


if __name__ == "__main__":
    main()