/**
 * ProjectChatPanel Component
 * Full-height chat interface with fixed sidebars
 * Neo-Brutalist styling - Sessions left, Chat center, Sources right
 */

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
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

    return (
        <div className="flex gap-3 h-full">
            {/* LEFT SIDEBAR: Sessions */}
            <div className={`w-64 flex-shrink-0 flex flex-col ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.medium} overflow-hidden`}>
                <div className={`p-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-100 flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm uppercase tracking-wide text-black">Conversations</h4>
                        <button
                            onClick={() => createSession()}
                            className={`p-2 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white text-black hover:bg-orange-200 ${TRANSITIONS.fast}`}
                            title="Nouvelle conversation"
                        >
                            <PlusIcon />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.length === 0 ? (
                        <p className="text-xs text-black text-center py-4">Cliquez sur <span className="font-bold">+</span> pour créer une conversation.</p>
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
                                <ConfirmDeleteButton isConfirming={isConfirmingId(session.id)} onDelete={() => handleDelete(() => deleteSession(session.id), session.id)} ariaLabel="Supprimer" />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CENTER: Main chat area */}
            <div className={`flex-1 flex flex-col ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.medium} min-w-0 overflow-hidden`}>
                <div className={`flex items-center justify-between px-4 py-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-50 flex-shrink-0`}>
                    <h3 className="font-black text-sm uppercase tracking-wide text-black truncate">
                        {currentSession ? (
                            pendingTitleAnimation?.sessionId === currentSession.id ? (
                                <TextType text={pendingTitleAnimation.title} typingSpeed={30} showCursor cursorCharacter="_" />
                            ) : currentSession.title
                        ) : 'Nouvelle conversation'}
                    </h3>
                    {selectedSourceIds.length > 0 && (
                        <span className={`text-xs font-bold text-black px-2 py-1 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white flex-shrink-0`}>
                            {selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className={`px-4 py-2 font-bold text-sm text-black ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white animate-pulse`}>Chargement...</div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className={`mb-4 p-5 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.small} text-orange-500`}><ChatBubbleIcon /></div>
                            <p className="text-black font-black text-lg mb-2">Discutez avec vos sources</p>
                            <p className="text-black font-medium text-sm max-w-md">
                                {readySources.length === 0 ? "Importez des sources pour activer la recherche." : "Posez des questions sur vos sources."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.filter(msg => msg.role !== 'assistant' || msg.content.trim()).map((msg, i, arr) => (
                                <ChatMessage key={msg.id} role={msg.role} content={msg.content} metadata={msg.message_metadata} isStreaming={isStreaming && i === arr.length - 1 && msg.role === 'assistant'} />
                            ))}
                            {isStreaming && messages[messages.length - 1]?.content.trim() === '' && (
                                <div className={`flex items-center gap-3 p-4 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.small}`}>
                                    <div className="flex gap-1">
                                        {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                    </div>
                                    <span className="text-sm text-black font-medium">{searchStatus.isSearching ? `Recherche: ${searchStatus.query || '...'}` : 'Réflexion...'}</span>
                                </div>
                            )}
                            {searchStatus.isSearching && messages[messages.length - 1]?.content.trim() !== '' && (
                                <div className={`flex items-center gap-3 p-4 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-orange-100 ${BRUTAL_SHADOWS.small}`}>
                                    <SearchIcon /><span className="font-black text-sm text-black">RECHERCHE</span>
                                    {searchStatus.query && <span className="text-sm text-black font-medium truncate">« {searchStatus.query} »</span>}
                                    <div className="ml-auto w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                    {error && <div className={`mt-4 p-4 ${BRUTAL_BORDERS.normal} border-red-600 ${BRUTAL_RADIUS.normal} bg-red-100 text-red-700 font-bold text-sm`}>Erreur: {error}</div>}
                </div>

                <form onSubmit={handleSubmit} className={`p-4 ${BRUTAL_BORDERS.normal} border-b-0 border-x-0 border-black bg-white flex-shrink-0`}>
                    <div className="flex gap-3 items-end">
                        <BrutalTextarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={selectedSourceIds.length === 0 ? "Mode conversation libre..." : "Posez une question..."} disabled={isStreaming} rows={2} className="flex-1 text-sm" />
                        <button type="submit" disabled={!inputValue.trim() || isStreaming} className={`p-4 flex items-center justify-center font-bold ${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_RADIUS.normal} ${BRUTAL_SHADOWS.medium} disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {isStreaming ? <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SendIcon />}
                        </button>
                    </div>
                </form>
            </div>

            {/* RIGHT SIDEBAR: Sources */}
            <div className={`w-64 flex-shrink-0 flex flex-col ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-white ${BRUTAL_SHADOWS.medium} overflow-hidden`}>
                <div className={`p-3 ${BRUTAL_BORDERS.normal} border-t-0 border-x-0 border-black bg-orange-100 flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm uppercase tracking-wide text-black">Sources</h4>
                            <span className={`text-xs font-bold text-black px-2 py-0.5 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white`}>{selectedSourceIds.length}/{readySources.length}</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setSelectedSourceIds(readySources.map(s => s.id))} className={`text-xs font-bold text-black px-2 py-1 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}>Tout</button>
                            <button onClick={() => setSelectedSourceIds([])} className={`text-xs font-bold text-black px-2 py-1 ${BRUTAL_BORDERS.thin} border-black ${BRUTAL_RADIUS.subtle} bg-white hover:bg-orange-200 ${TRANSITIONS.fast}`}>∅</button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {readySources.length === 0 ? (
                        <p className="text-xs text-black text-center py-4">Aucune source.<br /><span className="text-orange-600 font-bold">Importez des sources.</span></p>
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
                </div>
            </div>
        </div>
    );
}
