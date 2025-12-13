/**
 * Type definitions for Champollion frontend
 */

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  has_api_key: boolean;
  is_demo_user: boolean;
  demo_expires_at: string | null;
}

export interface LoginCredentials {
  username: string; // email
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  status: ProjectStatus;
  created_at: string;
  status_updated_at: string;
  sources: Source[];
  sources_count: number;
  documents_count: number;
  documents?: Document[];
  processing_status?: JobStatus;
  document_status?: JobStatus;
  processing_error?: string;
  document_error?: string;
}

export type ProjectStatus = 'draft' | 'processing' | 'ready';

export interface ProjectSummary {
  id: number;
  title: string;
  status: ProjectStatus;
  created_at: string;
  status_updated_at: string;
  sources_count: number;
  documents_count: number;
  processing_status?: JobStatus;
  document_status?: JobStatus;
}

export interface ProjectDetail extends Project {
  sources: Source[];
  documents?: Document[];
  processing_status?: JobStatus;
  document_status?: JobStatus;
}

export interface ProjectCreate {
  title: string;
  description?: string;
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
}


export interface JobStatus {
  status: 'pending' | 'in_progress' | 'succeeded' | 'failed';
  updated_at: string;
  error?: string;
}

export interface ProcessedContent {
  provider: string;
  text: string;
  created_at: string;
}

// New naming convention
export type CreateProjectData = ProjectCreate;

export type SourceType = 'audio' | 'document' | 'youtube' | 'pdf';
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Source {
  id: number;
  project_id: number;
  type: SourceType;
  status: SourceStatus;
  title: string;
  content?: string;
  processed_content?: string;
  created_at: string;
  jobStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  // Audio-specific fields (optional)
  filename?: string;
  duration_seconds?: number;
  size_bytes?: number;
  uploaded_at?: string;
  audio_metadata?: {
    duration_seconds?: number;
    sample_rate?: number;
    channels?: number;
    size_bytes?: number;
    format?: string;
    bitrate?: number;
  };
  // YouTube-specific fields (optional)
  youtube_metadata?: {
    video_id: string;
    channel_name?: string;
    video_title?: string;
    duration_seconds?: number;
    thumbnail_url?: string;
    language?: string;
    transcript_type?: string;
  };
  // Document-specific fields (optional)
  document_metadata?: {
    pages?: number;
    word_count?: number;
    size_bytes?: number;
    format?: string;
    language?: string;
  };
}

export interface CreateSourceData {
  type: SourceType;
  title: string;
  content?: string;
  metadata?: string;
}

export interface Document {
  id: number;
  provider: string;
  title: string | null;
  markdown: string;
  created_at: string;
  type: 'cours' | 'resume' | 'quiz';
}

export interface TokenEstimation {
  total_tokens: number;
  formatted_count: string;
  context_percentage: number;
  context_limit: number;
  source_count: number;
}

// Admin types
export interface DemoAccess {
  id: number;
  user_id: number;
  user_email: string;
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
  granted_by: string;
  notes: string | null;
  is_active: boolean;
}

export interface UserAdmin {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  has_api_key: boolean;
  created_at: string;
  demo_access: DemoAccess | null;
}
