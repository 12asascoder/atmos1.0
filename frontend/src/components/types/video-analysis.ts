export interface ColorPaletteItem {
  hex: string;
  ratio: number;
}

export interface TranscriptSegment {
  start?: number;
  end?: number;
  text: string;
}

export interface Transcript {
  text: string;
  segments: TranscriptSegment[];
}

export interface FaceDetection {
  unique_people_count: number;
  max_faces_in_single_frame: number;
  frames_with_faces: number;
  frames_analyzed: number;
}

export interface VideoMetadata {
  duration_seconds: number;
  fps: number;
  frame_count: number;
  resolution: {
    width: number;
    height: number;
  };
  file_size_mb: number;
  modified_time: string;
}

export interface RawAnalysis {
  content_type: string;
  video_id: string;
  filename: string;
  file_path: string;
  audio_path: string | null;
  video_metadata: VideoMetadata;
  transcript: Transcript;
  scenes: Array<{
    start_sec: number;
    end_sec: number;
  }>;
  scene_count: number;
  color_palette: ColorPaletteItem[];
  face_detection: FaceDetection;
  analysis_timestamp: string;
}

export interface EmotionalTriggers {
  excitement: number;
  trust: number;
  urgency: number;
  curiosity: number;
  desire: number;
  fear: number;
  hope: number;
}

export interface CreativeReport {
  ad_id: string;
  headline: string | null;
  opening_hook: {
    text: string | null;
    start_sec: number | null;
    end_sec: number | null;
    strength_score: number;
    reason: string;
  };
  value_propositions: any[];
  cta: {
    text: string | null;
    start_sec: number | null;
    clarity_score: number;
    urgency_score: number;
    placement: string;
  };
  emotional_triggers: EmotionalTriggers;
  visual_analysis: {
    primary_colors: string[];
    mood: string;
    visual_impact_score: number;
  };
  pacing: {
    scene_count: number;
    avg_scene_duration: number;
    hook_speed_sec: number | null;
    pacing_score: number;
  };
  brand_archetype: {
    type: string;
    score: number;
  };
  copy_quality_score: number;
  overall_score: number;
  viewer_age_estimate: {
    min: number;
    max: number;
    confidence: number;
    reason: string;
  };
  explanation_notes: string[];
}

export interface RecentAnalysis {
  id: string;
  file_type: string;
  created_at: string;
  path: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  raw_analysis: RawAnalysis;
  creative_report: CreativeReport | null;
  file_type: string;
  error?: string;
}

export interface RecentAnalysesResponse {
  success: boolean;
  analyses: RecentAnalysis[];
  error?: string;
}