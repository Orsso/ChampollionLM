import { Card } from '../cards/Card';
import { useMarkdown } from '../../../lib/useMarkdown';

interface MarkdownViewerProps {
  markdown: string;
  className?: string;
}

/**
 * MarkdownViewer Component
 *
 * Renders markdown content as sanitized HTML with styled formatting.
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
    <Card
      className={`p-6 markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
