import { useState, useEffect, useRef, useMemo } from 'react';
import { SourceModal } from '../ui/media';
import { SourceCard } from './SourceCard';
import { deleteSource, updateSource, reprocessSource } from '../../hooks/useSources';
import { useAuth, useConfirmDelete } from '../../hooks';
import { API_BASE_URL } from '../../lib/api';
import type { Source, JobStatus } from '../../types';
import {
  BORDERS,
  SHADOWS,
  RADIUS
} from '../../constants/styles';

interface SourcesListProps {
  projectId: string | number;
  sources: Source[];
  processingStatus?: JobStatus;
  onMutate?: () => void;
}

export function SourcesList({ projectId, sources, processingStatus, onMutate }: SourcesListProps) {
  const { token } = useAuth();
  const { isConfirmingId, handleDelete } = useConfirmDelete<number>();

  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  // Derive selectedSource from sources array to keep it in sync with live data
  // This ensures the modal updates when transcription completes via polling
  const selectedSource = useMemo(() => {
    if (selectedSourceId === null) return null;
    return sources.find(s => s.id === selectedSourceId) ?? null;
  }, [selectedSourceId, sources]);
  const [retryingSourceId, setRetryingSourceId] = useState<number | null>(null);
  const audioUrlsRef = useRef(audioUrls);

  // Sort sources by created_at descending (newest first)
  const sortedSources = useMemo(() => {
    if (!sources) return [];
    return [...sources].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [sources]);

  useEffect(() => {
    audioUrlsRef.current = audioUrls;
  }, [audioUrls]);

  const loadAudioForSource = async (source: Source) => {
    if (!token || source.type !== 'audio' || audioUrlsRef.current[source.id]) return;

    try {
      const url = `${API_BASE_URL}/api/projects/${projectId}/sources/${source.id}/file`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

      if (!response.ok) throw new Error('Failed to load audio');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrls(prev => ({ ...prev, [source.id]: blobUrl }));
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    return () => {
      Object.values(audioUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  const handleDeleteClick = async (sourceId: number) => {
    handleDelete(async () => {
      await deleteSource(projectId, sourceId);
      onMutate?.();

      if (selectedSourceId === sourceId) {
        setSourceModalOpen(false);
        setSelectedSourceId(null);
      }

      if (audioUrlsRef.current[sourceId]) {
        URL.revokeObjectURL(audioUrlsRef.current[sourceId]);
        setAudioUrls(prev => {
          const next = { ...prev };
          delete next[sourceId];
          return next;
        });
      }
    }, sourceId);
  };

  const handleSourceClick = (source: Source) => {
    setSelectedSourceId(source.id);

    if (source.type === 'audio') {
      loadAudioForSource(source);
    }

    setSourceModalOpen(true);
  };

  const handleRenameSource = async (sourceId: number, newTitle: string) => {
    await updateSource(projectId, sourceId, { title: newTitle });
    onMutate?.();
  };

  const handleRetryClick = async (sourceId: number) => {
    setRetryingSourceId(sourceId);
    try {
      await reprocessSource(projectId, sourceId);
      onMutate?.();
    } catch {
      // Error handling - could add toast notification here
      console.error('Failed to reprocess source');
    } finally {
      setRetryingSourceId(null);
    }
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`
      ${BORDERS.thick}
      border-black
      ${RADIUS.normal}
      ${SHADOWS.medium}
      bg-white
      p-6
    `}>
      <h2 className="text-xl font-black text-black mb-4">Sources du projet</h2>

      <div className="space-y-3">
        {sortedSources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            processingStatus={processingStatus}
            isConfirmingDelete={isConfirmingId(source.id)}
            isRetrying={retryingSourceId === source.id}
            onClick={() => handleSourceClick(source)}
            onDelete={() => handleDeleteClick(source.id)}
            onRetry={() => handleRetryClick(source.id)}
          />
        ))}
      </div>

      {selectedSource && (
        <SourceModal
          isOpen={sourceModalOpen}
          onClose={() => {
            setSourceModalOpen(false);
            setSelectedSourceId(null);
          }}
          source={selectedSource}
          fileUrl={audioUrls[selectedSource.id]}
          onRename={handleRenameSource}
          onDelete={handleDeleteClick}
          isConfirmingDelete={isConfirmingId(selectedSource.id)}
          processingStatus={processingStatus}
        />
      )}
    </div>
  );
}
