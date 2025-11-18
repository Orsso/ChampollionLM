import { useState, useEffect } from 'react';
import { Alert } from '../ui/feedback';
import { GenerationControls } from './GenerationControls';
import { DocumentPreview } from './DocumentPreview';
import { useGenerateDocument, useDeleteDocument } from '../../hooks/useDocuments';
import { useSources } from '../../hooks/useSources';
import { useProject } from '../../hooks/useProjects';
import { API_BASE_URL, getToken } from '../../lib/api';

interface StudioPanelProps {
  projectId: string | number;
  onMutate?: () => void;
}

export function StudioPanel({ projectId, onMutate }: StudioPanelProps) {
  const { generateDocument } = useGenerateDocument(projectId);
  const { deleteDocument } = useDeleteDocument(projectId);
  const { project, mutate: mutateProject } = useProject(projectId);
  const { mutate: mutateSources } = useSources(projectId);

  const [error, setError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const readySources = (project?.sources || []).filter(s => s.processed_content || s.transcript);
  const hasAnyProcessedContent = readySources.length > 0;
  const generatedDocument = project?.document;
  const documentStatus = project?.document_status?.status;
  const isGenerating = documentStatus === 'pending' || documentStatus === 'in_progress';

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      mutateProject();
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating, mutateProject]);

  const handleGenerateDocument = async (sourceIds: number[], title?: string) => {
    setError(null);
    setIsLaunching(true);
    try {
      await generateDocument({ sourceIds, title });
    } catch (err) {
      let errorMessage = 'Erreur lors de la generation';
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;
      setError(errorMessage);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDeleteDocument = async () => {
    setError(null);
    try {
      await deleteDocument();
    } catch (err) {
      let errorMessage = 'Erreur lors de la suppression';
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;
      setError(errorMessage);
    }
  };

  const updateDocumentTitle = async (title: string) => {
    const token = getToken();
    const resp = await fetch(`${API_BASE_URL}/api/projects/${projectId}/documents`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Erreur inconnue' }));
      throw new Error(err?.detail || 'Echec du renommage');
    }
    await mutateProject();
  };

  return (
    <div className="space-y-6">
      <GenerationControls
        projectId={projectId}
        projectTitle={project?.title}
        readySources={readySources}
        isGenerating={isGenerating}
        isLaunching={isLaunching}
        hasAnyProcessedContent={hasAnyProcessedContent}
        onGenerate={handleGenerateDocument}
      />

      {error && <Alert variant="error" message={error} />}

      {(generatedDocument?.markdown || isGenerating) && (
        <DocumentPreview
          projectId={projectId}
          projectTitle={project?.title}
          document={generatedDocument}
          isGenerating={isGenerating}
          isLaunching={isLaunching}
          onDelete={handleDeleteDocument}
          onRename={updateDocumentTitle}
          onMutate={() => {
            mutateSources();
            onMutate?.();
          }}
          confirmingDelete={confirmingDelete}
          onConfirmDeleteChange={setConfirmingDelete}
        />
      )}
    </div>
  );
}
