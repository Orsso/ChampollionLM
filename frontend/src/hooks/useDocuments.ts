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
      type: 'cours', // Always use 'cours' for now (scaffold for future)
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

  const deleteDocument = async (documentId?: number): Promise<void> => {
    // If documentId is provided, delete specific document
    // Otherwise fallback to legacy behavior (delete all/latest) - though backend now requires ID for specific delete
    // For backward compatibility, we might need to handle the case where no ID is passed
    // But since we updated the UI to pass ID, we should expect it.

    if (documentId !== undefined) {
      await fetcher(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });
    } else {
      // Fallback: try to delete "the document" (legacy route was DELETE /documents)
      // But we changed the backend to DELETE /documents/{id}
      // So this might fail if we don't pass an ID.
      // However, for safety, let's assume the caller MUST pass an ID now.
      console.error("deleteDocument called without documentId");
      throw new Error("Document ID is required for deletion");
    }
    await mutate();
  };

  return { deleteDocument };
}
