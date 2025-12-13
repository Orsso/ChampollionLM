import { useState } from 'react';
import { Modal } from '../layout';
import { AudioPlayer } from './AudioPlayer';
import { TranscriptView } from './TranscriptView';
import { MarkdownViewer } from './MarkdownViewer';
import { Badge, ShinyText } from '../feedback';
import { AnimatedInput } from '../forms';
import { Button, ConfirmDeleteButton } from '../buttons';
import { formatDateSimple, formatSize, formatDuration } from '../../../utils/formatters';
import { BORDERS, RADIUS, SHADOWS, TRANSITIONS } from '../../../constants/styles';
import type { Source } from '../../../types';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: Source;
  fileUrl?: string;
  onRename?: (sourceId: number, newTitle: string) => Promise<void>;
  onDelete?: (sourceId: number) => void;
  isConfirmingDelete?: boolean;
  processingStatus?: { status: 'pending' | 'in_progress' | 'succeeded' | 'failed' };
}

/**
 * SourceModal Component
 *
 * Generic modal for displaying source content based on type.
 * Supports audio (with player + transcript) and document (markdown viewer).
 * Extensible via type-specific renderers.
 */
export function SourceModal({
  isOpen,
  onClose,
  source,
  fileUrl,
  onRename,
  onDelete,
  isConfirmingDelete = false,
  processingStatus
}: SourceModalProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const hasProcessedContent = Boolean(source.processed_content);
  const jobStatus = processingStatus?.status;
  const isJobActive = jobStatus === 'pending' || jobStatus === 'in_progress';
  const isProcessing = !hasProcessedContent && isJobActive;

  const handleRenameClick = () => {
    setRenameValue(source.title || '');
    setRenameOpen(true);
  };

  const handleRenameSubmit = async () => {
    const title = renameValue.trim();
    if (!title || !onRename) return;
    try {
      await onRename(source.id, title);
      setRenameOpen(false);
    } catch (err) {
      console.error('Rename failed', err);
    }
  };

  const renderContent = () => {
    // Audio source
    if (source.type === 'audio') {
      return (
        <div className="space-y-6">
          {/* Audio Player */}
          {fileUrl ? (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                Lecture audio
              </h3>
              <AudioPlayer src={fileUrl} duration={source.duration_seconds} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
              <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full"></div>
              Chargement de l'audio...
            </div>
          )}

          {/* Processed Content / Transcript */}
          {hasProcessedContent && (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                Transcription
              </h3>
              <TranscriptView
                text={source.processed_content || ''}
              />
            </div>
          )}

          {/* Processing status */}
          {isProcessing && (
            <div className="flex items-center justify-center p-4 bg-orange-50 rounded-lg border-2 border-black">
              <Badge color="amber">
                <ShinyText size="sm">Traitement en cours...</ShinyText>
              </Badge>
            </div>
          )}
        </div>
      );
    }

    // YouTube source
    if (source.type === 'youtube') {
      const videoId = source.youtube_metadata?.video_id;
      return (
        <div className="space-y-6">
          {/* Video link and thumbnail */}
          {videoId && (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                Vidéo source
              </h3>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold ${BORDERS.normal} border-black ${RADIUS.subtle} ${SHADOWS.small} transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
                Voir sur YouTube
              </a>
            </div>
          )}

          {/* Transcript */}
          {hasProcessedContent && (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                Transcription
              </h3>
              <TranscriptView
                text={source.processed_content || ''}
              />
            </div>
          )}
        </div>
      );
    }

    // Document source
    if (source.type === 'document') {
      return (
        <div className="space-y-4">
          <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide pb-2 ${BORDERS.thin} border-b-black`}>
            Contenu du document
          </h3>
          {source.content ? (
            <MarkdownViewer markdown={source.content} />
          ) : (
            <p className="text-slate-600 text-sm font-semibold">Aucun contenu disponible</p>
          )}
        </div>
      );
    }

    // Unknown type fallback
    return (
      <p className="text-slate-600 text-sm font-semibold">
        Type de source non supporté: {source.type}
      </p>
    );
  };

  const getTypeIcon = () => {
    if (source.type === 'audio') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    }
    if (source.type === 'youtube') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      );
    }
    if (source.type === 'document') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    }
    return null;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={(
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center bg-orange-500 text-white ${BORDERS.thin} border-black`}>
              {getTypeIcon()}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{source.title}</h2>
              {source.filename && source.type === 'audio' && (
                <p className="text-xs text-slate-600 font-semibold">{source.filename}</p>
              )}
            </div>
          </div>
        )}
        headerRight={(
          <div className="flex items-center gap-2">
            {/* Rename button */}
            {onRename && (
              <button
                onClick={handleRenameClick}
                className={`p-2 ${BORDERS.normal} border-black bg-white hover:bg-orange-50 text-black ${RADIUS.subtle} ${SHADOWS.small} transition-all ${TRANSITIONS.fast} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold`}
                aria-label="Renommer"
                title="Renommer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            )}

            {/* Delete button */}
            {onDelete && !isProcessing && (
              <ConfirmDeleteButton
                isConfirming={isConfirmingDelete}
                onDelete={() => onDelete(source.id)}
                ariaLabel={isConfirmingDelete ? `Confirmer la suppression de ${source.title}` : `Supprimer ${source.title}`}
              />
            )}
          </div>
        )}
        maxWidth="max-w-4xl"
      >
        {/* Metadata bar */}
        <div className={`flex items-center gap-4 mb-6 pb-3 text-sm text-slate-700 font-semibold ${BORDERS.thin} border-b-black`}>
          {source.type === 'audio' && source.duration_seconds && (
            <span>
              Durée: {formatDuration(source.duration_seconds)}
            </span>
          )}
          {source.type === 'audio' && source.size_bytes && (
            <span>
              Taille: {formatSize(source.size_bytes)}
            </span>
          )}
          {source.created_at && (
            <span>
              Créé le {formatDateSimple(source.created_at)}
            </span>
          )}
        </div>

        {/* Content */}
        {renderContent()}
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Renommer la source"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <AnimatedInput
            label="Titre"
            value={renameValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)}
            darkMode={false}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setRenameOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameSubmit}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
