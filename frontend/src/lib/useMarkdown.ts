/**
 * Shared markdown rendering utilities
 * 
 * Provides consistent markdown parsing and sanitization across:
 * - MarkdownViewer (documents, sources)
 * - ChatMessage (chat responses)
 */

import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';

/**
 * DOMPurify configuration for rich markdown rendering
 * Allows headings, tables, lists, code blocks, and inline formatting
 */
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

/**
 * Parse markdown to sanitized HTML
 * 
 * @param markdown Raw markdown string
 * @returns Sanitized HTML string
 */
export function parseMarkdown(markdown: string): string {
    if (!markdown) return '';

    // Configure marked for GitHub-flavored markdown
    marked.setOptions({ gfm: true, breaks: true, pedantic: false });

    try {
        const rawHtml = marked.parse(markdown) as string;
        return DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);
    } catch (error) {
        console.error('Error parsing markdown:', error);
        return '<p class="text-red-500 font-bold">Erreur lors du rendu du markdown</p>';
    }
}

/**
 * Hook for memoized markdown parsing
 * Use this in components that need to render markdown content
 * 
 * @param markdown Raw markdown string
 * @returns Memoized sanitized HTML string
 */
export function useMarkdown(markdown: string): string {
    return useMemo(() => parseMarkdown(markdown), [markdown]);
}
