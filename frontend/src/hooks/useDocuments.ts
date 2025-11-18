import { fetcher } from '../lib/api';
import { useProject } from './useProjects';

/**
 * Generate document for a project
 */
export function useGenerateDocument(projectId: string | number) {
  const { mutate } = useProject(projectId);

  type GenerateOptions = {
    sourceIds?: number[];
    title?: string;
    provider?: string;
  };

  const generateDocument = async (opts?: GenerateOptions): Promise<void> => {
    const body: Record<string, unknown> = {
      provider: opts?.provider ?? 'mistral',
    };
    
    if (opts?.sourceIds && opts.sourceIds.length > 0) {
      body.source_ids = opts.sourceIds;
    }
    if (opts?.title && opts.title.trim().length > 0) {
      body.title = opts.title.trim();
    }

    await fetcher(`/api/projects/${projectId}/documents`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await mutate();
  };

  return { generateDocument };
}

/**
 * Delete document for a project
 */
export function useDeleteDocument(projectId: string | number) {
  const { mutate } = useProject(projectId);

  const deleteDocument = async (): Promise<void> => {
    await fetcher(`/api/projects/${projectId}/documents`, {
      method: 'DELETE',
    });
    await mutate();
  };

  return { deleteDocument };
}
