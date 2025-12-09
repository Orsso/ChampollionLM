import { useSWRData } from './useSWRData';
import { fetcher, swrFetcher, uploadFetcher } from '../lib/api';
import { useAuth } from './useAuth';
import type { Source, CreateSourceData } from '../types';

/**
 * Fetch all sources for a project
 */
export function useSources(projectId: string | number | undefined) {
  const { token } = useAuth();

  const { data, isLoading, isError, mutate } = useSWRData<Source[]>(
    token && projectId ? `/api/projects/${projectId}/sources` : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    sources: data,
    isLoading,
    isError,
    mutate,
  };
}

/**
 * Create a new source
 */
export async function createSource(projectId: string | number, data: CreateSourceData): Promise<Source> {
  return fetcher<Source>(`/api/projects/${projectId}/sources`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a source
 */
export async function deleteSource(projectId: string | number, sourceId: number): Promise<void> {
  return fetcher<void>(`/api/projects/${projectId}/sources/${sourceId}`, {
    method: 'DELETE',
  });
}

/**
 * Upload an audio source (creates Source of type 'audio' and triggers processing)
 */
export async function uploadAudioSource(projectId: string | number, file: File): Promise<Source> {
  const formData = new FormData();
  formData.append('file', file);
  return uploadFetcher<Source>(`/api/projects/${projectId}/sources/audio`, formData);
}

/**
 * Update a source (e.g., title/content)
 */
export async function updateSource(projectId: string | number, sourceId: number, data: Partial<Pick<Source, 'title'>> & { content?: string }): Promise<Source> {
  return fetcher<Source>(`/api/projects/${projectId}/sources/${sourceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Import YouTube video transcript as source
 */
export async function importYouTubeSource(projectId: string | number, url: string): Promise<Source> {
  return fetcher<Source>(`/api/projects/${projectId}/sources/youtube`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

/**
 * Reprocess a source (retry failed processing)
 */
export async function reprocessSource(projectId: string | number, sourceId: number): Promise<void> {
  return fetcher<void>(`/api/projects/${projectId}/sources/${sourceId}/reprocess`, {
    method: 'POST',
  });
}
