import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';
import { BRUTAL_SHADOWS, BRUTAL_CARD_VARIANTS } from '../../../constants/styles';

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
  // Configure marked
  marked.setOptions({ gfm: true, breaks: true, pedantic: false });

  const DOMPURIFY_CONFIG: DOMPurifyConfig = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'ul', 'ol', 'li',
      'strong', 'em', 'code', 'pre', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'br', 'del', 'input', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'class', 'id', 'type', 'checked', 'disabled']
  };

  const htmlContent = useMemo(() => {
    if (!markdown) return '';
    try {
      const rawHtml = marked.parse(markdown) as string;
      return DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return '<p class="text-red-500 font-bold">Erreur lors du rendu du markdown</p>';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  return (
    <div
      className={`${BRUTAL_CARD_VARIANTS.default} ${BRUTAL_SHADOWS.medium} p-6 markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
