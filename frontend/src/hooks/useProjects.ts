import { useSWRData } from './useSWRData';
import type { Project, ProjectCreate } from '../types';
import { swrFetcher, fetcher } from '../lib/api';
import { useAuth } from './useAuth';

/**
 * Fetch all projects for the authenticated user
 */
export function useProjects() {
  const { token } = useAuth();
  const { data, isLoading, isError, mutate } = useSWRData<Project[]>(
    token ? '/api/projects' : null,
    swrFetcher
  );

  return {
    projects: data,
    isLoading,
    isError,
    mutate,
  };
}

/**
 * Fetch a single project by ID
 */
export function useProject(projectId: string | number | undefined) {
  const { token } = useAuth();
  const { data, isLoading, isError, mutate } = useSWRData<Project>(
    token && projectId ? `/api/projects/${projectId}` : null,
    swrFetcher
  );

  return {
    project: data,
    isLoading,
    isError,
    mutate,
  };
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const { mutate } = useProjects();

  const createProject = async (data: ProjectCreate): Promise<Project> => {
    const project = await fetcher<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    mutate(); // Revalidate projects list
    return project;
  };

  return { createProject };
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const { mutate } = useProjects();

  const deleteProject = async (projectId: string | number): Promise<void> => {
    await fetcher(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    // Force immediate revalidation
    await mutate();
  };

  return { deleteProject };
}
