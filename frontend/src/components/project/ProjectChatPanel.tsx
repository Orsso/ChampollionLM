/**
 * ProjectChatPanel Component
 * Full-height chat interface with toggleable sidebars
 * Sessions left, Chat center (no container), Sources right
 * Panels slide in/out with swipe animation
 */

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectChat } from '../../hooks/useProjectChat';
import { useConfirmDelete } from '../../hooks/useConfirmDelete';
import { ChatMessage } from '../ui/media/ChatMessage';
import { Textarea, SourceSelectionItem } from '../ui/forms';
import { ConfirmDeleteButton, Button, LightButton } from '../ui/buttons';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { SlidingPanel } from '../ui/layout';
import { TextType } from '../ui/animations';
import { BORDERS, SHADOWS, RADIUS, TRANSITIONS } from '../../constants/styles';
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



export function ProjectChatPanel({ projectId, sources }: ProjectChatPanelProps) {
    const { t } = useTranslation();
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
        <Button
            onClick={() => createSession()}
            variant="secondary"
            size="sm"
            className="p-1 px-2"
            title={t('project.chat.newConversation')}
        >
            <PlusIcon />
        </Button>
    );

    // Sources panel header actions
    const sourcesHeaderActions = (
        <div className="flex items-center gap-1">
            <span className={`text-xs font-bold text-black px-1.5 py-0.5 ${BORDERS.thin} border-black ${RADIUS.subtle} bg-white`}>
                {selectedSourceIds.length}/{readySources.length}
            </span>
            <LightButton
                onClick={() => setSelectedSourceIds(readySources.map(s => s.id))}
                className="py-0.5 h-auto min-h-0"
                title={t('common.selectAll')}
            >
                {t('common.all')}
            </LightButton>
            <LightButton
                onClick={() => setSelectedSourceIds([])}
                className="py-0.5 h-auto min-h-0"
                title={t('common.deselectAll')}
            >
                ∅
            </LightButton>
        </div>
    );

    return (
        <div className="relative flex h-full min-h-0 gap-3">
            {/* Floating toggle button for left panel when closed */}
            {!leftPanelOpen && (
                <LightButton
                    onClick={() => setLeftPanelOpen(true)}
                    className="absolute left-2 top-2 z-10 shadow-sm p-1.5"
                    title={t('project.chat.showConversations')}
                >
                    <MessageSquareIcon />
                </LightButton>
            )}

            {/* Floating toggle button for right panel when closed */}
            {!rightPanelOpen && (
                <LightButton
                    onClick={() => setRightPanelOpen(true)}
                    className="absolute right-2 top-2 z-10 shadow-sm p-1.5"
                    title={t('project.chat.showSources')}
                >
                    <LayersIcon />
                </LightButton>
            )}

            {/* LEFT SIDEBAR: Sessions */}
            <SlidingPanel
                isOpen={leftPanelOpen}
                onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
                side="left"
                title={t('common.conversations')}
                headerActions={sessionHeaderActions}
            >
                {sessions.length === 0 ? (
                    <p className="text-xs text-black text-center py-4">
                        {t('project.chat.createConversationHint')}
                    </p>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="flex items-center gap-1">
                            <button
                                onClick={() => selectSession(session.id)}
                                className={`flex-1 text-left px-2 py-2 text-xs font-medium truncate ${BORDERS.thin} border-black ${RADIUS.subtle} ${currentSession?.id === session.id ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-50'} ${TRANSITIONS.fast}`}
                                title={session.title}
                            >
                                {pendingTitleAnimation?.sessionId === session.id ? (
                                    <TextType text={pendingTitleAnimation.title} typingSpeed={30} showCursor cursorCharacter="_" onComplete={clearPendingTitle} />
                                ) : session.title}
                            </button>
                            <ConfirmDeleteButton
                                isConfirming={isConfirmingId(session.id)}
                                onDelete={() => handleDelete(() => deleteSession(session.id), session.id)}
                                ariaLabel={t('common.delete')}
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
                            <div className={`px-4 py-2 font-bold text-sm text-black ${BORDERS.thin} border-black ${RADIUS.subtle} bg-white animate-pulse`}>
                                {t('common.loading')}
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className={`mb-4 p-5 ${BORDERS.normal} border-black ${RADIUS.normal} bg-white ${SHADOWS.small} text-orange-500`}>
                                <ChatBubbleIcon />
                            </div>
                            <p className="text-black font-black text-lg mb-2">{t('project.chat.chatWithSources')}</p>
                            <p className="text-black font-medium text-sm max-w-md">
                                {readySources.length === 0 ? t('project.chat.importSourcesHint') : t('project.chat.askAboutSources')}
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
                            <ChatStatusIndicator
                                isSearching={searchStatus.isSearching}
                                query={searchStatus.query}
                                isTyping={isStreaming && messages[messages.length - 1]?.content.trim() === ''}
                            />
                        </div>
                    )}
                    {error && (
                        <div className={`mt-4 p-4 ${BORDERS.normal} border-red-600 ${RADIUS.normal} bg-red-100 text-red-700 font-bold text-sm max-w-3xl mx-auto`}>
                            {t('common.error')}: {error}
                        </div>
                    )}
                </div>

                {/* Input area */}
                <form onSubmit={handleSubmit} className="flex-shrink-0 px-4 pb-4 pt-2">
                    <div className="max-w-3xl mx-auto flex gap-3 items-center">
                        <Textarea
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedSourceIds.length === 0 ? t('common.freeMode') : t('common.askQuestion')}
                            disabled={isStreaming}
                            rows={2}
                            className="flex-1 text-sm"
                        />
                        <Button
                            type="submit"
                            disabled={!inputValue.trim() || isStreaming}
                            variant="primary"
                            size="lg"
                            className="p-4"
                        >
                            {isStreaming ? (
                                <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <SendIcon />
                            )}
                        </Button>
                    </div>
                    {selectedSourceIds.length > 0 && (
                        <div className="max-w-3xl mx-auto mt-2">
                            <span className={`inline-block text-xs font-bold text-black px-2 py-1 ${BORDERS.thin} border-black ${RADIUS.subtle} bg-white`}>
                                {selectedSourceIds.length} {t('common.source')}{selectedSourceIds.length > 1 ? 's' : ''} {selectedSourceIds.length > 1 ? t('common.selectedPlural') : t('common.selected')}
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
                title={t('common.sources')}
                headerActions={sourcesHeaderActions}
            >
                {readySources.length === 0 ? (
                    <p className="text-xs text-black text-center py-4">
                        {t('project.chat.noSourcesPanel')}<br />
                        <span className="text-orange-600 font-bold">{t('project.chat.importSourcesAction')}</span>
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
