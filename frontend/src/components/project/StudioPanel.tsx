import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '../ui/feedback';
import { GenerationControls } from './GenerationControls';
import { DocumentsList } from './DocumentsList';
import { DocumentModal } from '../ui/media';
import { useGenerateDocument } from '../../hooks/useDocuments';
import { useSources } from '../../hooks/useSources';
import { useProject } from '../../hooks/useProjects';
import { useConfirmDelete } from '../../hooks';
import { updateDocument, deleteDocument as apiDeleteDocument } from '../../lib/api';
import type { Document } from '../../types';

interface StudioPanelProps {
  projectId: string | number;
  onMutate?: () => void;
}

export function StudioPanel({ projectId, onMutate }: StudioPanelProps) {
  const { t } = useTranslation();
  const { generateDocument } = useGenerateDocument(projectId);
  const { project, mutate: mutateProject } = useProject(projectId);
  const { mutate: mutateSources } = useSources(projectId);

  const [error, setError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [generatingDocTitle, setGeneratingDocTitle] = useState<string | undefined>(undefined);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const { isConfirmingId, handleDelete } = useConfirmDelete<number>();

  const readySources = (project?.sources || []).filter(s => s.processed_content);
  const hasAnyProcessedContent = readySources.length > 0;
  const documents = project?.documents || [];
  const documentStatus = project?.document_status?.status;
  const isGenerating = documentStatus === 'pending' || documentStatus === 'in_progress';
  const isJobFailed = documentStatus === 'failed';
  const jobError = project?.document_status?.error;

  const handleGenerateDocument = async (sourceIds: number[], title?: string) => {
    setError(null);
    setIsLaunching(true);
    setGeneratingDocTitle(title);
    try {
      await generateDocument({ sourceIds, title });
    } catch (err) {
      let errorMessage = t('project.studio.generationError');
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;
      setError(errorMessage);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDeleteClick = (documentId: number) => {
    handleDelete(async () => {
      setError(null);
      try {
        await apiDeleteDocument(Number(projectId), documentId);
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
          setDocModalOpen(false);
        }
        await mutateProject();
      } catch {
        setError(t('project.studio.deleteError'));
      }
    }, documentId);
  };

  const updateDocumentTitle = async (documentId: number, title: string) => {
    try {
      await updateDocument(Number(projectId), documentId, title);
      await mutateProject();
    } catch {
      throw new Error(t('project.studio.renameFailed'));
    }
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
    setDocModalOpen(true);
  };

  const handleMutate = () => {
    mutateSources();
    mutateProject();
    onMutate?.();
  };

  const displayError = error || (isJobFailed ? (jobError || t('project.studio.generationFailed')) : null);

  return (
    <div className="space-y-8">
      <GenerationControls
        projectId={projectId}
        projectTitle={project?.title}
        readySources={readySources}
        isGenerating={isGenerating}
        isLaunching={isLaunching}
        hasAnyProcessedContent={hasAnyProcessedContent}
        onGenerate={handleGenerateDocument}
      />

      {displayError && <Alert variant="error" message={displayError} />}

      <DocumentsList
        projectId={projectId}
        projectTitle={project?.title}
        documents={documents}
        isGenerating={isGenerating}
        generatingDocTitle={generatingDocTitle}
        onMutate={handleMutate}
        onDocumentClick={handleDocumentClick}
      />

      {/* Document modal - shown when a document is selected */}
      {selectedDocument && (
        <DocumentModal
          isOpen={docModalOpen}
          onClose={() => {
            setDocModalOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          projectId={projectId}
          projectTitle={project?.title}
          onDelete={handleDeleteClick}
          onRename={updateDocumentTitle}
          isConfirmingDelete={isConfirmingId(selectedDocument.id)}
          onMutate={handleMutate}
        />
      )}
    </div>
  );
}
