import { AudioUploadZone } from './AudioUploadZone';
import { SourcesList } from './SourcesList';
import type { Source, JobStatus } from '../../types';

interface SourcesPanelProps {
  projectId: string | number;
  sources: Source[];
  processingStatus?: JobStatus;
  onMutate?: () => void;
}

export function SourcesPanel({ projectId, sources, processingStatus, onMutate }: SourcesPanelProps) {
  return (
    <div className="space-y-6">
      <AudioUploadZone projectId={projectId} onMutate={onMutate} />
      <SourcesList
        projectId={projectId}
        sources={sources}
        processingStatus={processingStatus}
        onMutate={onMutate}
      />
    </div>
  );
}
