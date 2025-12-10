/**
 * ChatMessage Component
 * Displays individual chat messages with Neo-Brutalist styling
 * Shows sources used when RAG search was performed
 */

import { useState } from 'react';
import { BRUTAL_SHADOWS, BRUTAL_BORDERS, BRUTAL_RADIUS } from '../../../constants/styles';
import { useMarkdown } from '../../../lib/useMarkdown';

interface ChunkPreview {
    source: string;
    preview: string;
}

interface ChatMessageProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
        action?: string;
        selected_text?: string;
        sources_used?: string[];
        chunks_found?: ChunkPreview[];
    } | null;
    isStreaming?: boolean;
}

// Action labels without emojis
const ACTION_LABELS: Record<string, string> = {
    explain: 'EXPLIQUER',
    expand: 'DÉVELOPPER',
    summarize: 'RÉSUMER',
    refine: 'AFFINER',
};

// Book/document icon for sources
const BookIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

// Chevron icon for expand/collapse
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// Collapsible sources section
function SourcesSection({ sourcesUsed, chunksFound }: { sourcesUsed?: string[]; chunksFound?: ChunkPreview[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`mt-4 pt-3 ${BRUTAL_BORDERS.thin} border-x-0 border-b-0 border-slate-200`}>
            {/* Sources header - clickable to expand */}
            <div
                className="flex flex-wrap items-center gap-2 mb-2 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <BookIcon />
                    Sources consultées
                    <ChevronIcon isOpen={isOpen} />
                </span>
                {sourcesUsed?.map((source, idx) => (
                    <span
                        key={idx}
                        className={`
                            px-2 py-0.5 text-[10px] font-bold
                            ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle}
                            bg-orange-50 text-black
                        `}
                    >
                        {source}
                    </span>
                ))}
            </div>

            {/* Chunks preview - only when expanded */}
            {isOpen && chunksFound && chunksFound.length > 0 && (
                <div className="mt-2 space-y-2">
                    {chunksFound.map((chunk, idx) => (
                        <div
                            key={idx}
                            className={`
                                p-2 text-[11px] text-slate-600
                                ${BRUTAL_BORDERS.thin} border-slate-200 ${BRUTAL_RADIUS.subtle}
                                bg-slate-50
                            `}
                        >
                            <span className="font-bold text-slate-500">[{chunk.source}]</span>
                            <p className="mt-1 italic">{chunk.preview}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ChatMessage({ role, content, metadata, isStreaming }: ChatMessageProps) {
    // Use shared markdown hook for rich rendering
    const htmlContent = useMarkdown(content);

    const isUser = role === 'user';
    const isAssistant = role === 'assistant';
    const sourcesUsed = metadata?.sources_used;
    const chunksFound = metadata?.chunks_found;

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`
                    max-w-[90%] p-4 ${BRUTAL_RADIUS.normal} ${BRUTAL_BORDERS.normal} border-black
                    ${isUser
                        ? 'bg-orange-100 ' + BRUTAL_SHADOWS.small
                        : 'bg-white ' + BRUTAL_SHADOWS.small
                    }
                    ${isStreaming ? 'relative overflow-hidden' : ''}
                `}
            >
                {/* Action badge for contextual messages */}
                {metadata?.action && (
                    <div className="mb-3">
                        <span className={`
                            inline-block px-2 py-1 text-[10px] font-black uppercase tracking-wider
                            ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle}
                            bg-orange-300 text-black
                        `}>
                            {ACTION_LABELS[metadata.action] || metadata.action.toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Selected text preview */}
                {metadata?.selected_text && (
                    <div className={`
                        mb-3 p-3 ${BRUTAL_RADIUS.subtle}
                        bg-slate-100 ${BRUTAL_BORDERS.thin} border-slate-300
                        text-sm text-slate-600 italic
                    `}>
                        « {metadata.selected_text.slice(0, 100)}{metadata.selected_text.length > 100 ? '...' : ''} »
                    </div>
                )}

                {/* Message content */}
                <div className={`${isUser ? 'text-right' : 'text-left'}`}>
                    {isAssistant ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                            className="
                                text-black text-sm leading-relaxed markdown-content
                                [&>p]:mb-3 [&>p:last-child]:mb-0
                                [&>pre]:bg-slate-100 [&>pre]:p-3 [&>pre]:rounded [&>pre]:text-xs [&>pre]:overflow-x-auto [&>pre]:mb-3
                                [&>code]:bg-slate-100 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
                                [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul>li]:mb-1
                                [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ol>li]:mb-1
                                [&>h1]:text-lg [&>h1]:font-black [&>h1]:mb-2
                                [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2
                                [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-2
                                [&>h4]:text-sm [&>h4]:font-semibold [&>h4]:mb-2
                                [&>blockquote]:border-l-4 [&>blockquote]:border-orange-400 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600
                                [&>hr]:my-4 [&>hr]:border-t-2 [&>hr]:border-black
                                [&>del]:line-through [&>del]:text-slate-500
                                [&>table]:w-full [&>table]:mb-3 [&>table]:border-collapse [&>table]:border-2 [&>table]:border-black
                                [&_th]:bg-orange-100 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold [&_th]:border [&_th]:border-black
                                [&_td]:p-2 [&_td]:border [&_td]:border-black
                            "
                        />
                    ) : (
                        <p className="text-black font-medium text-sm m-0">{content}</p>
                    )}
                </div>

                {/* Sources used badge - shows which sources were consulted and chunks found */}
                {isAssistant && (sourcesUsed?.length || chunksFound?.length) && (
                    <SourcesSection sourcesUsed={sourcesUsed} chunksFound={chunksFound} />
                )}

                {/* Streaming indicator - subtle animation bar */}
                {isStreaming && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 overflow-hidden">
                        <div className="h-full bg-orange-400 animate-[shimmer_1.5s_infinite] w-1/3"
                            style={{
                                animation: 'shimmer 1.5s infinite',
                                background: 'linear-gradient(90deg, transparent, #fb923c, transparent)'
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
