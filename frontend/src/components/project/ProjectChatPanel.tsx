/**
 * ProjectChatPanel Component
 * Full-width chat interface for project-level conversations
 * Uses RAG on all project sources with optional filtering
 * Neo-Brutalist styling - Sessions left, Chat center, Sources right
 */

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useProjectChat } from '../../hooks/useProjectChat';
import { useConfirmDelete } from '../../hooks/useConfirmDelete';
import { ChatMessage } from '../ui/media/ChatMessage';
import { BrutalTextarea } from '../ui/forms';
import { ConfirmDeleteButton } from '../ui/buttons';
import { TextType } from '../ui/animations';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, BRUTAL_BUTTON_VARIANTS, TRANSITIONS } from '../../constants/styles';
import type { Source, SourceType } from '../../types';

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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// Source type icons
const AudioIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const YoutubeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
    </svg>
);

const DocumentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
    </svg>
);

// Source type badge
function SourceTypeBadge({ type }: { type: SourceType }) {
    const configs: Record<SourceType, { icon: React.ReactNode; bg: string }> = {
        audio: { icon: <AudioIcon />, bg: 'bg-purple-500' },
        youtube: { icon: <YoutubeIcon />, bg: 'bg-red-500' },
        document: { icon: <DocumentIcon />, bg: 'bg-blue-500' },
    };
    const config = configs[type] || configs.document;

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${config.bg} text-white text-[10px] font-bold uppercase rounded`}>
            {config.icon}
        </span>
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
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const shouldScrollRef = useRef(true);

    // Get ready sources
    const readySources = sources.filter(s => s.processed_content || s.content);

    // Initialize with all sources selected ONLY on first mount
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
        // Pass source_ids only if filtering (not all selected)
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

    const toggleSourceSelection = (sourceId: number) => {
        setSelectedSourceIds(prev =>
            prev.includes(sourceId) ? prev.filter(id => id !== sourceId) : [...prev, sourceId]
        );
    };

    const selectAllSources = () => setSelectedSourceIds(readySources.map(s => s.id));
    const deselectAllSources = () => setSelectedSourceIds([]);

    const handleNewChat = async () => {
        await createSession();
    };

    const handleDeleteSession = (sessionId: number) => {
        handleDelete(async () => {
            await deleteSession(sessionId);
        }, sessionId);
    };

    return (
        <div className="flex gap-4 h-[700px]">
            {/* LEFT SIDEBAR: Sessions only */}
            <div className={`w-56 flex-shrink-0 flex flex-col ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.medium}`}>
                {/* Header */}
                <div className={`px-4 py-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-100`}>
                    <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm uppercase tracking-wide text-black">
                            Conversations
                        </h4>
                        <button
                            onClick={handleNewChat}
                            className={`p-1.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}
                            title="Nouvelle conversation"
                        >
                            <PlusIcon />
                        </button>
                    </div>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {/* All sessions including saved ones */}
                    {sessions.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">
                            Cliquez sur + pour créer<br />une conversation.
                        </p>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => selectSession(session.id)}
                                    className={`flex-1 text-left px-3 py-2 text-sm font-medium truncate ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} ${currentSession?.id === session.id
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-white text-black hover:bg-orange-50'
                                        } ${TRANSITIONS.fast}`}
                                    title={`${session.title} (${session.message_count} messages)`}
                                >
                                    {pendingTitleAnimation?.sessionId === session.id ? (
                                        <TextType
                                            text={pendingTitleAnimation.title}
                                            typingSpeed={30}
                                            showCursor={true}
                                            cursorCharacter="_"
                                            onComplete={clearPendingTitle}
                                        />
                                    ) : (
                                        session.title
                                    )}
                                </button>
                                <ConfirmDeleteButton
                                    isConfirming={isConfirmingId(session.id)}
                                    onDelete={() => handleDeleteSession(session.id)}
                                    ariaLabel={isConfirmingId(session.id) ? "Confirmer la suppression" : "Supprimer"}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CENTER: Main chat area */}
            <div className={`flex-1 flex flex-col ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-slate-50 ${BRUTAL_SHADOWS.medium}`}>
                {/* Chat header */}
                <div className={`flex items-center justify-between px-5 py-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-white`}>
                    <h3 className="font-black text-base uppercase tracking-wide text-black">
                        {currentSession ? (
                            pendingTitleAnimation?.sessionId === currentSession.id ? (
                                <TextType
                                    text={pendingTitleAnimation.title}
                                    typingSpeed={30}
                                    showCursor={true}
                                    cursorCharacter="_"
                                />
                            ) : (
                                currentSession.title
                            )
                        ) : 'Chat'}
                    </h3>
                    {selectedSourceIds.length > 0 && (
                        <span className="text-xs font-bold text-slate-600">
                            {selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''} active{selectedSourceIds.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Messages area */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className={`px-4 py-2 font-bold text-sm text-black ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white animate-pulse`}>
                                Chargement...
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className={`mb-6 p-6 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.small} text-orange-500`}>
                                <ChatBubbleIcon />
                            </div>
                            <p className="text-black font-black text-lg mb-2">
                                Discutez avec vos sources
                            </p>
                            <p className="text-slate-600 font-medium text-sm max-w-md">
                                {readySources.length === 0
                                    ? "Importez des sources pour activer la recherche sémantique."
                                    : selectedSourceIds.length === 0
                                        ? "Mode conversation libre. Sélectionnez des sources pour activer le RAG →"
                                        : "Posez des questions sur vos sources. L'IA utilisera la recherche sémantique."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages
                                .filter(msg => msg.role !== 'assistant' || msg.content.trim() !== '')
                                .map((msg, index, filteredMsgs) => (
                                    <ChatMessage
                                        key={msg.id}
                                        role={msg.role}
                                        content={msg.content}
                                        metadata={msg.message_metadata}
                                        isStreaming={isStreaming && index === filteredMsgs.length - 1 && msg.role === 'assistant'}
                                    />
                                ))}

                            {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content.trim() === '' && (
                                <div className={`flex items-center gap-3 p-4 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.small}`}>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-sm text-black font-medium">
                                        {searchStatus.isSearching ? `Recherche: ${searchStatus.query || '...'}` : 'Réflexion...'}
                                    </span>
                                </div>
                            )}

                            {searchStatus.isSearching && messages[messages.length - 1]?.content.trim() !== '' && (
                                <div className={`flex items-center gap-3 p-4 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-orange-100 ${BRUTAL_SHADOWS.small}`}>
                                    <div className="flex items-center gap-2 text-black">
                                        <SearchIcon />
                                        <span className="font-black text-sm">RECHERCHE</span>
                                    </div>
                                    {searchStatus.query && (
                                        <span className="text-sm text-black font-medium truncate">
                                            « {searchStatus.query} »
                                        </span>
                                    )}
                                    <div className="ml-auto">
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className={`mt-4 p-4 ${BRUTAL_BORDERS.normal} border-red-600 ${BRUTAL_RADIUS.normal} bg-red-100 text-red-700 font-bold text-sm`}>
                            Erreur: {error}
                        </div>
                    )}
                </div>

                {/* Input area */}
                <form onSubmit={handleSubmit} className={`p-4 ${BRUTAL_BORDERS.normal} border-b-0 border-x-0 border-black bg-white`}>
                    <div className="flex gap-3 items-start">
                        <BrutalTextarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedSourceIds.length === 0 ? "Mode conversation libre..." : "Posez une question sur vos sources..."}
                            disabled={isStreaming}
                            rows={2}
                            className="flex-1 text-sm h-[56px] min-h-[56px]"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isStreaming}
                            className={`p-4 h-[56px] w-[56px] flex items-center justify-center font-bold ${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_RADIUS.normal} ${BRUTAL_SHADOWS.medium} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isStreaming ? (
                                <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <SendIcon />
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* RIGHT SIDEBAR: Sources only */}
            <div className={`w-56 flex-shrink-0 flex flex-col ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.medium}`}>
                {/* Header */}
                <div className={`px-4 py-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-100`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm uppercase tracking-wide text-black">
                                Sources
                            </h4>
                            <span className="text-xs font-bold text-slate-600">
                                {selectedSourceIds.length}/{readySources.length}
                            </span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                            <button
                                onClick={selectAllSources}
                                className={`text-[10px] font-bold px-2 py-1 text-black ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}
                            >
                                Tout
                            </button>
                            <button
                                onClick={deselectAllSources}
                                className={`text-[10px] font-bold px-2 py-1 text-black ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}
                            >
                                Aucun
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sources list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {readySources.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">
                            Aucune source prête.<br />
                            <span className="text-orange-600 font-bold">Importez des sources.</span>
                        </p>
                    ) : (
                        readySources.map(source => (
                            <label
                                key={source.id}
                                className={`flex items-start gap-2 p-2 cursor-pointer ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} ${selectedSourceIds.includes(source.id)
                                    ? 'bg-orange-100 border-orange-500'
                                    : 'bg-white hover:bg-slate-50'
                                    } ${TRANSITIONS.fast}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSourceIds.includes(source.id)}
                                    onChange={() => toggleSourceSelection(source.id)}
                                    className="w-4 h-4 mt-0.5 accent-orange-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                        <SourceTypeBadge type={source.type} />
                                    </div>
                                    <span className="text-xs font-bold text-black block truncate">
                                        {source.title}
                                    </span>
                                </div>
                            </label>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
