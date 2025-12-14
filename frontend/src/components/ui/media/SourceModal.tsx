import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
                {t('project.sources.audioPlayback')}
              </h3>
              <AudioPlayer src={fileUrl} duration={source.duration_seconds} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
              <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full"></div>
              {t('project.sources.loadingAudio')}
            </div>
          )}

          {/* Processed Content / Transcript */}
          {hasProcessedContent && (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                {t('project.sources.transcription')}
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
                <ShinyText size="sm">{t('project.sources.processing')}</ShinyText>
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
                {t('project.sources.sourceVideo')}
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
                {t('project.sources.viewOnYoutube')}
              </a>
            </div>
          )}

          {/* Transcript */}
          {hasProcessedContent && (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                {t('project.sources.transcription')}
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
            {t('project.sources.documentContent')}
          </h3>
          {source.content ? (
            <MarkdownViewer markdown={source.content} />
          ) : (
            <p className="text-slate-600 text-sm font-semibold">{t('project.sources.noContentAvailable')}</p>
          )}
        </div>
      );
    }

    // PDF source
    if (source.type === 'pdf') {
      return (
        <div className="space-y-6">
          {/* Extracted OCR Content */}
          {hasProcessedContent && (
            <div>
              <h3 className={`text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 ${BORDERS.thin} border-b-black`}>
                {t('project.sources.extractedText')}
              </h3>
              <MarkdownViewer
                markdown={source.processed_content || ''}
              />
            </div>
          )}

          {/* Processing status */}
          {isProcessing && (
            <div className="flex items-center justify-center p-4 bg-orange-50 rounded-lg border-2 border-black">
              <Badge color="amber">
                <ShinyText size="sm">{t('project.sources.ocrInProgress')}</ShinyText>
              </Badge>
            </div>
          )}

          {/* Failed processing */}
          {!hasProcessedContent && !isProcessing && source.jobStatus === 'failed' && (
            <div className={`
              p-4 bg-red-50 rounded-lg
              ${BORDERS.normal}
              border-red-500
              space-y-3
            `}>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-700 font-semibold text-sm">
                    {t('project.sources.ocrFailed')}
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    {t('project.sources.ocrFailedHint')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  fetch(`/api/projects/${source.project_id}/sources/${source.id}/reprocess`, {
                    method: 'POST',
                    credentials: 'include'
                  }).then(() => window.location.reload());
                }}
                className={`
                  px-3 py-1.5 text-sm font-medium
                  bg-red-600 text-white
                  ${BORDERS.normal}
                  border-red-700
                  ${RADIUS.subtle}
                  hover:bg-red-700
                  transition-colors
                `}
              >
                {t('project.sources.retry')}
              </button>
            </div>
          )}

          {/* No content yet */}
          {!hasProcessedContent && !isProcessing && source.jobStatus !== 'failed' && (
            <p className="text-slate-600 text-sm font-semibold">{t('project.sources.noExtractedContent')}</p>
          )}
        </div>
      );
    }

    // Unknown type fallback
    return (
      <p className="text-slate-600 text-sm font-semibold">
        {t('project.sources.unsupportedSourceType')}: {source.type}
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
    if (source.type === 'pdf') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12h4" />
          <path d="M10 16h4" />
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
                aria-label={t('project.sources.rename')}
                title={t('project.sources.rename')}
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
                ariaLabel={isConfirmingDelete
                  ? t('project.sources.deleteConfirm') + ' ' + source.title
                  : t('project.sources.delete') + ' ' + source.title}
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
              {t('project.sources.duration')}: {formatDuration(source.duration_seconds)}
            </span>
          )}
          {source.type === 'audio' && source.size_bytes && (
            <span>
              {t('project.sources.size')}: {formatSize(source.size_bytes)}
            </span>
          )}
          {source.created_at && (
            <span>
              {t('project.sources.createdOn')} {formatDateSimple(source.created_at)}
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
        title={t('project.sources.renameSource')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <AnimatedInput
            label={t('project.documents.renameTitle')}
            value={renameValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)}
            darkMode={false}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setRenameOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameSubmit}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
