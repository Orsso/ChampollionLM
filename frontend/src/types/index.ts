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
  document?: Document;
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
  processing_status?: JobStatus;
  document_status?: JobStatus;
}

export interface ProjectDetail extends Project {
  sources: Source[];
  document?: Document;
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

export type SourceType = 'audio' | 'document';

export interface Source {
  id: number;
  type: SourceType;
  title: string;
  created_at: string;
  has_processed_content: boolean;
  processed_content?: ProcessedContent;
  // Audio-specific fields (optional)
  filename?: string;
  duration_seconds?: number;
  size_bytes?: number;
  uploaded_at?: string;
  // Document-specific fields (optional)
  content?: string;
  file_path?: string;
  metadata?: string | Record<string, unknown>;
  // Legacy fields for transition
  has_transcript?: boolean;
  transcript?: ProcessedContent;
}

export interface CreateSourceData {
  type: SourceType;
  title: string;
  content?: string;
  metadata?: string;
}

export interface Document {
  provider: string;
  title: string | null;
  markdown: string;
  created_at: string;
}

export interface TokenEstimation {
  total_tokens: number;
  formatted_count: string;
  context_percentage: number;
  context_limit: number;
  source_count: number;
}

