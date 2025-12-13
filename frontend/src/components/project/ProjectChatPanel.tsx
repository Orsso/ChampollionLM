/**
 * ProjectChatPanel Component
 * Full-height chat interface with toggleable sidebars
 * Neo-Brutalist styling - Sessions left, Chat center (no container), Sources right
 * Panels slide in/out with swipe animation
 */

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useProjectChat } from '../../hooks/useProjectChat';
import { useConfirmDelete } from '../../hooks/useConfirmDelete';
import { ChatMessage } from '../ui/media/ChatMessage';
import { BrutalTextarea, SourceSelectionItem } from '../ui/forms';
import { ConfirmDeleteButton } from '../ui/buttons';
import { TextType } from '../ui/animations';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, BRUTAL_BUTTON_VARIANTS, TRANSITIONS } from '../../constants/styles';
import type { Source } from '../../types';

interface ProjectChatPanelProps {
    projectId: number | string;
    sources: Source[];
}

// Icons
const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22,2 15,22 11,13 2,9 22,2" />
    </svg>
);

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const ChatBubbleIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const MessageSquareIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const LayersIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

// Sliding Panel Component - handles animation and toggle logic
interface SlidingPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    side: 'left' | 'right';
    title: string;
    headerActions?: ReactNode;
    children: ReactNode;
}

function SlidingPanel({ isOpen, onToggle, side, title, headerActions, children }: SlidingPanelProps) {
    const isLeft = side === 'left';

    return (
        <div
            className={`
                flex-shrink-0 h-full overflow-hidden
                transition-all duration-300 ease-out
                ${isOpen ? 'w-64' : 'w-0'}
            `}
        >
            <div
                className={`
                    w-64 h-full flex flex-col
                    ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal}
                    bg-white ${BRUTAL_SHADOWS.medium}
                    transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : isLeft ? '-translate-x-full' : 'translate-x-full'}
                `}
            >
                <div className={`p-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-100 flex-shrink-0`}>
                    <div className="flex items-center justify-between gap-2">
                        {isLeft && (
                            <button
                                onClick={onToggle}
                                className={`p-1.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white text-black hover:bg-orange-200 ${TRANSITIONS.fast}`}
                                title="Masquer"
                            >
                                <ChevronLeftIcon />
                            </button>
                        )}
                        <h4 className="font-black text-sm uppercase tracking-wide text-black flex-1">{title}</h4>
                        {headerActions}
                        {!isLeft && (
                            <button
                                onClick={onToggle}
                                className={`p-1.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white text-black hover:bg-orange-200 ${TRANSITIONS.fast}`}
                                title="Masquer"
                            >
                                <ChevronRightIcon />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ProjectChatPanel({ projectId, sources }: ProjectChatPanelProps) {
    const {
        messages, isStreaming, searchStatus, error, sendMessage, isLoading,
        sessions, currentSession, createSession, selectSession, deleteSession,
        pendingTitleAnimation, clearPendingTitle
    } = useProjectChat(projectId);

    const { handleDelete, isConfirmingId } = useConfirmDelete<number>();
    const [inputValue, setInputValue] = useState('');
    const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const shouldScrollRef = useRef(true);

    // Panel toggle state
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);

    // Get ready sources
    const readySources = sources.filter(s => s.processed_content || s.content);

    // Initialize with all sources selected on first mount
    const [hasInitializedSources, setHasInitializedSources] = useState(false);
    useEffect(() => {
        if (!hasInitializedSources && readySources.length > 0) {
            setSelectedSourceIds(readySources.map(s => s.id));
            setHasInitializedSources(true);
        }
    }, [readySources, hasInitializedSources]);

    const scrollToBottom = useCallback((force = false) => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (force || isNearBottom || shouldScrollRef.current) {
            container.scrollTop = container.scrollHeight;
            shouldScrollRef.current = false;
        }
    }, []);

    useEffect(() => {
        shouldScrollRef.current = true;
        scrollToBottom(true);
    }, [messages.length, scrollToBottom]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isStreaming) return;
        const message = inputValue.trim();
        const options = selectedSourceIds.length > 0 && selectedSourceIds.length < readySources.length
            ? { source_ids: selectedSourceIds }
            : undefined;
        setInputValue('');
        shouldScrollRef.current = true;
        await sendMessage(message, options);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
        }
    };

    // Session panel header actions
    const sessionHeaderActions = (
        <button
            onClick={() => createSession()}
            className={`p-1.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white text-black hover:bg-orange-200 ${TRANSITIONS.fast}`}
            title="Nouvelle conversation"
        >
            <PlusIcon />
        </button>
    );

    // Sources panel header actions
    const sourcesHeaderActions = (
        <div className="flex items-center gap-1">
            <span className={`text-xs font-bold text-black px-1.5 py-0.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white`}>
                {selectedSourceIds.length}/{readySources.length}
            </span>
            <button
                onClick={() => setSelectedSourceIds(readySources.map(s => s.id))}
                className={`text-xs font-bold text-black px-1.5 py-0.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}
            >
                Tout
            </button>
            <button
                onClick={() => setSelectedSourceIds([])}
                className={`text-xs font-bold text-black px-1.5 py-0.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}
            >
                ∅
            </button>
        </div>
    );

    return (
        <div className="relative flex h-full min-h-0 gap-3">
            {/* Floating toggle button for left panel when closed */}
            {!leftPanelOpen && (
                <button
                    onClick={() => setLeftPanelOpen(true)}
                    className={`absolute left-2 top-2 z-10 p-2 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white text-black hover:bg-orange-100 ${TRANSITIONS.fast} ${BRUTAL_SHADOWS.small}`}
                    title="Afficher les conversations"
                >
                    <MessageSquareIcon />
                </button>
            )}

            {/* Floating toggle button for right panel when closed */}
            {!rightPanelOpen && (
                <button
                    onClick={() => setRightPanelOpen(true)}
                    className={`absolute right-2 top-2 z-10 p-2 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white text-black hover:bg-orange-100 ${TRANSITIONS.fast} ${BRUTAL_SHADOWS.small}`}
                    title="Afficher les sources"
                >
                    <LayersIcon />
                </button>
            )}

            {/* LEFT SIDEBAR: Sessions */}
            <SlidingPanel
                isOpen={leftPanelOpen}
                onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
                side="left"
                title="Conversations"
                headerActions={sessionHeaderActions}
            >
                {sessions.length === 0 ? (
                    <p className="text-xs text-black text-center py-4">
                        Cliquez sur <span className="font-bold">+</span> pour créer une conversation.
                    </p>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="flex items-center gap-1">
                            <button
                                onClick={() => selectSession(session.id)}
                                className={`flex-1 text-left px-2 py-2 text-xs font-medium truncate ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} ${currentSession?.id === session.id ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-50'} ${TRANSITIONS.fast}`}
                                title={session.title}
                            >
                                {pendingTitleAnimation?.sessionId === session.id ? (
                                    <TextType text={pendingTitleAnimation.title} typingSpeed={30} showCursor cursorCharacter="_" onComplete={clearPendingTitle} />
                                ) : session.title}
                            </button>
                            <ConfirmDeleteButton
                                isConfirming={isConfirmingId(session.id)}
                                onDelete={() => handleDelete(() => deleteSession(session.id), session.id)}
                                ariaLabel="Supprimer"
                            />
                        </div>
                    ))
                )}
            </SlidingPanel>

            {/* CENTER: Main chat area - No container, integrated into background */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Messages area */}
                <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className={`px-4 py-2 font-bold text-sm text-black ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white animate-pulse`}>
                                Chargement...
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className={`mb-4 p-5 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.small} text-orange-500`}>
                                <ChatBubbleIcon />
                            </div>
                            <p className="text-black font-black text-lg mb-2">Discutez avec vos sources</p>
                            <p className="text-black font-medium text-sm max-w-md">
                                {readySources.length === 0 ? "Importez des sources pour activer la recherche." : "Posez des questions sur vos sources."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {messages.filter(msg => msg.role !== 'assistant' || msg.content.trim()).map((msg, i, arr) => (
                                <ChatMessage
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    metadata={msg.message_metadata}
                                    isStreaming={isStreaming && i === arr.length - 1 && msg.role === 'assistant'}
                                />
                            ))}
                            {isStreaming && messages[messages.length - 1]?.content.trim() === '' && (
                                <div className={`flex items-center gap-3 p-4 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.small}`}>
                                    <div className="flex gap-1">
                                        {[0, 150, 300].map(d => (
                                            <div key={d} className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-black font-medium">
                                        {searchStatus.isSearching ? `Recherche: ${searchStatus.query || '...'}` : 'Réflexion...'}
                                    </span>
                                </div>
                            )}
                            {searchStatus.isSearching && messages[messages.length - 1]?.content.trim() !== '' && (
                                <div className={`flex items-center gap-3 p-4 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-orange-100 ${BRUTAL_SHADOWS.small}`}>
                                    <SearchIcon />
                                    <span className="font-black text-sm text-black">RECHERCHE</span>
                                    {searchStatus.query && <span className="text-sm text-black font-medium truncate">« {searchStatus.query} »</span>}
                                    <div className="ml-auto w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                    {error && (
                        <div className={`mt-4 p-4 ${BRUTAL_BORDERS.normal} border-red-600 ${BRUTAL_RADIUS.normal} bg-red-100 text-red-700 font-bold text-sm max-w-3xl mx-auto`}>
                            Erreur: {error}
                        </div>
                    )}
                </div>

                {/* Input area */}
                <form onSubmit={handleSubmit} className="flex-shrink-0 px-4 pb-4 pt-2">
                    <div className="max-w-3xl mx-auto flex gap-3 items-center">
                        <BrutalTextarea
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedSourceIds.length === 0 ? "Mode conversation libre..." : "Posez une question..."}
                            disabled={isStreaming}
                            rows={2}
                            className="flex-1 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isStreaming}
                            className={`p-4 flex items-center justify-center font-bold ${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_RADIUS.normal} ${BRUTAL_SHADOWS.medium} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isStreaming ? (
                                <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <SendIcon />
                            )}
                        </button>
                    </div>
                    {selectedSourceIds.length > 0 && (
                        <div className="max-w-3xl mx-auto mt-2">
                            <span className={`inline-block text-xs font-bold text-black px-2 py-1 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white`}>
                                {selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''} sélectionnée{selectedSourceIds.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </form>
            </div>

            {/* RIGHT SIDEBAR: Sources */}
            <SlidingPanel
                isOpen={rightPanelOpen}
                onToggle={() => setRightPanelOpen(!rightPanelOpen)}
                side="right"
                title="Sources"
                headerActions={sourcesHeaderActions}
            >
                {readySources.length === 0 ? (
                    <p className="text-xs text-black text-center py-4">
                        Aucune source.<br />
                        <span className="text-orange-600 font-bold">Importez des sources.</span>
                    </p>
                ) : (
                    readySources.map(source => (
                        <SourceSelectionItem
                            key={source.id}
                            id={source.id}
                            title={source.title}
                            type={source.type}
                            checked={selectedSourceIds.includes(source.id)}
                            onChange={(checked) => {
                                if (checked) {
                                    setSelectedSourceIds(prev => [...prev, source.id]);
                                } else {
                                    setSelectedSourceIds(prev => prev.filter(id => id !== source.id));
                                }
                            }}
                            compact
                        />
                    ))
                )}
            </SlidingPanel>
        </div>
    );
}
