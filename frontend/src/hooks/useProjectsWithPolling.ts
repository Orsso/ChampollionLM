import { useMemo } from 'react';
import { useSWRData } from './useSWRData';
import type { Project } from '../types';
import { swrFetcher } from '../lib/api';
import { useAuth } from './useAuth';

/**
 * Fetch all projects with intelligent polling
 * Only polls when there are active jobs (processing/documents)
 */
export function useProjectsWithPolling() {
  const { token } = useAuth();

  // First, fetch to get the data
  const { data, isLoading, isError, mutate } = useSWRData<Project[]>(
    token ? '/api/projects' : null,
    swrFetcher
  );

  // Check if any project has an active job
  const hasActiveJobs = useMemo(() => {
    if (!data) return false;
    
    return data.some(project => {
      const processingActive = 
        project.processing_status?.status === 'pending' || 
        project.processing_status?.status === 'in_progress';
      
      const documentActive = 
        project.document_status?.status === 'pending' || 
        project.document_status?.status === 'in_progress';
      
      return processingActive || documentActive;
    });
  }, [data]);

  // Now fetch with polling if there are active jobs
  const { data: polledData } = useSWRData<Project[]>(
    token && hasActiveJobs ? '/api/projects' : null,
    swrFetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      dedupingInterval: 2000, // Avoid duplicate requests within 2s
    }
  );

  return {
    projects: polledData || data,
    isLoading,
    isError,
    mutate,
    hasActiveJobs,
  };
}
