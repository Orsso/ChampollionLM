import { useTranslation } from 'react-i18next';
import { Card } from '../ui/cards';
import { Badge, ShinyText } from '../ui/feedback';
import { ConfirmDeleteButton, LightButton } from '../ui/buttons';
import { RefreshIcon } from '../ui/icons';
import { formatDateShort, formatDuration, formatSize } from '../../utils/formatters';
import type { Source, JobStatus } from '../../types';

interface SourceCardProps {
  source: Source;
  processingStatus?: JobStatus;
  isConfirmingDelete: boolean;
  isRetrying?: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRetry?: () => void;
}

/**
 * Pure presentational component for displaying a single source.
 *
 * Handles visual rendering only - all logic (delete, click handling)
 * is managed by parent component or hooks.
 */
export function SourceCard({
  source,
  processingStatus,
  isConfirmingDelete,
  isRetrying,
  onClick,
  onDelete,
  onRetry
}: SourceCardProps) {
  const { t } = useTranslation();

  // Determine processing state
  const hasProcessedContent = Boolean(source.processed_content);
  const jobStatus = processingStatus?.status;
  const isJobActive = jobStatus === 'pending' || jobStatus === 'in_progress';
  const isJobFailed = jobStatus === 'failed';
  const isProcessing = !hasProcessedContent && isJobActive;

  // Source icon (audio vs document vs youtube vs pdf)
  const sourceIcon = source.type === 'audio' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ) : source.type === 'youtube' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  ) : source.type === 'pdf' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  // Status badge
  let badge = null;
  if (isProcessing) {
    badge = (
      <Badge color="amber">
        <ShinyText size="sm">{t('project.sources.processing')}</ShinyText>
      </Badge>
    );
  } else if (isJobFailed && !hasProcessedContent) {
    badge = <Badge color="gray">{t('common.error')}</Badge>;
  } else if (hasProcessedContent) {
    badge = <Badge color="green">{t('projects.status.ready')}</Badge>;
  }

  // Metadata display (Phase 7: use typed metadata if available)
  let metadata = null;
  if (source.type === 'audio') {
    if (source.audio_metadata) {
      // Phase 7: Use typed metadata
      const { duration_seconds, size_bytes } = source.audio_metadata;
      if (duration_seconds && size_bytes) {
        metadata = `${formatDuration(duration_seconds)} · ${formatSize(size_bytes)}`;
      }
    } else if (source.duration_seconds && source.size_bytes) {
      // Legacy: fallback to flat fields
      metadata = `${formatDuration(source.duration_seconds)} · ${formatSize(source.size_bytes)}`;
    }
  } else if (source.type === 'youtube' && source.youtube_metadata) {
    const { language, transcript_type } = source.youtube_metadata;
    const parts = [];
    if (language) parts.push(language.toUpperCase());
    if (transcript_type) parts.push(transcript_type === 'auto-generated' ? 'Auto' : 'Manual');
    metadata = parts.length > 0 ? `Transcript ${parts.join(' · ')}` : 'YouTube';
  } else if (source.type === 'pdf' && source.created_at) {
    // PDF: show file added date
    metadata = `PDF ${t('project.sources.createdOn')} ${formatDateShort(source.created_at)}`;
  } else if (source.type === 'document' && source.created_at) {
    metadata = `Document ${t('project.sources.createdOn')} ${formatDateShort(source.created_at)}`;
  }

  return (
    <Card
      onClick={onClick}
      className="p-4"
      hoverEffect={true}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 text-black">
          {sourceIcon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-black font-bold truncate">
              {source.title}
            </h3>
            {badge && (
              <div className="flex-shrink-0 flex items-center gap-2">
                {badge}
                {/* Retry button next to failed badge */}
                {isJobFailed && !hasProcessedContent && onRetry && (
                  <LightButton
                    onClick={(e) => { e.stopPropagation(); onRetry(); }}
                    className="p-1 h-auto min-h-0"
                    title={t('project.sources.retry')}
                    disabled={isRetrying}
                  >
                    <RefreshIcon size={14} className={isRetrying ? 'animate-spin' : ''} />
                  </LightButton>
                )}
              </div>
            )}
          </div>

          {metadata && (
            <div className="text-slate-600 text-sm mt-1 font-medium">
              {metadata}
            </div>
          )}
        </div>

        {!isProcessing && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <ConfirmDeleteButton
              isConfirming={isConfirmingDelete}
              onDelete={onDelete}
              ariaLabel={isConfirmingDelete
                ? `${t('project.sources.deleteConfirm')} ${source.title}`
                : `${t('project.sources.delete')} ${source.title}`}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
