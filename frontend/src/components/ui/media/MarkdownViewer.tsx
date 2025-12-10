import { BRUTAL_SHADOWS, BRUTAL_CARD_VARIANTS } from '../../../constants/styles';
import { useMarkdown } from '../../../lib/useMarkdown';

interface MarkdownViewerProps {
  markdown: string;
  className?: string;
}

/**
 * MarkdownViewer Component
 *
 * Renders markdown content as sanitized HTML with Neo-Brutalist styling.
 * Used in SourceModal for document sources and in StudioPanel.
 *
 * Features:
 * - Thick borders and hard shadows
 * - Bold typography
 * - Saturated colors (orange for headings, yellow for code blocks)
 * - Opaque backgrounds
 */
export function MarkdownViewer({ markdown, className = '' }: MarkdownViewerProps) {
  const htmlContent = useMarkdown(markdown);

  return (
    <div
      className={`${BRUTAL_CARD_VARIANTS.default} ${BRUTAL_SHADOWS.medium} p-6 markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
