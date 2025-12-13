/**
 * DocumentChatPanel Component
 * Sidebar chat interface for document conversations
 */

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useDocumentChat, type ChatOptions } from '../../../hooks/useDocumentChat';
import { ChatMessage } from './ChatMessage';
import { Textarea } from '../forms';
import { Button } from '../buttons/Button';
import { BORDERS, SHADOWS, RADIUS, TRANSITIONS } from '../../../constants/styles';

interface DocumentChatPanelProps {
    documentId: number;
    selectedText?: string | null;
    initialAction?: 'explain' | 'expand' | 'summarize' | 'refine';
    onClose: () => void;
}

// Icons as SVG components
const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,6 5,6 21,6" />
        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

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
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export function DocumentChatPanel({
    documentId,
    selectedText,
    initialAction,
    onClose
}: DocumentChatPanelProps) {
    const { messages, isStreaming, searchStatus, error, sendMessage, clearHistory, isLoading } = useDocumentChat(documentId);

    const [inputValue, setInputValue] = useState('');
    const [pendingAction, setPendingAction] = useState<ChatOptions | null>(
        initialAction && selectedText
            ? { action: initialAction, selected_text: selectedText }
            : null
    );

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const shouldScrollRef = useRef(true);

    // Scroll to bottom - only when user is already at bottom or new message arrives
    const scrollToBottom = useCallback((force = false) => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (force || isNearBottom || shouldScrollRef.current) {
            container.scrollTop = container.scrollHeight;
            shouldScrollRef.current = false;
        }
    }, []);

    // Scroll when messages change
    useEffect(() => {
        shouldScrollRef.current = true;
        scrollToBottom(true);
    }, [messages.length, scrollToBottom]);

    // Auto-fill message when there's a pending action
    useEffect(() => {
        if (pendingAction && inputRef.current) {
            const prompts: Record<string, string> = {
                explain: 'Explique ce passage en détail.',
                expand: 'Développe ce point avec plus d\'exemples.',
                summarize: 'Résume ce contenu de façon concise.',
                refine: 'Propose des améliorations pour ce passage.',
            };
            setInputValue(prompts[pendingAction.action!] || '');
            inputRef.current.focus();
        }
    }, [pendingAction]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isStreaming) return;

        const options = pendingAction || undefined;
        const message = inputValue.trim();

        setInputValue('');
        setPendingAction(null);
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
        <div className={`
      flex flex-col h-full w-[400px] min-w-[360px]
      ${BORDERS.normal} border-l-0 border-black
      bg-slate-50
    `}>
            {/* Header */}
            <div className={`
        flex items-center justify-between px-5 py-4
        ${BORDERS.normal} border-t-0 border-x-0 border-black
        bg-white
      `}>
                <h3 className="font-black text-base uppercase tracking-wide text-black">
                    Assistant
                </h3>
                <div className="flex gap-2">
                    {messages.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className={`
                p-2
                ${BORDERS.thin} border-black ${RADIUS.subtle}
                hover:bg-red-100 ${TRANSITIONS.fast}
                text-slate-600 hover:text-red-600
              `}
                            title="Effacer l'historique"
                        >
                            <TrashIcon />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`
              p-2
              ${BORDERS.thin} border-black ${RADIUS.subtle}
              hover:bg-slate-200 ${TRANSITIONS.fast}
              text-slate-600 hover:text-black
            `}
                        title="Fermer"
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-5"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className={`
              px-4 py-2 font-bold text-sm
              ${BORDERS.thin} border-black ${RADIUS.subtle}
              bg-white animate-pulse
            `}>
                            Chargement...
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className={`
              mb-6 p-4
              ${BORDERS.normal} border-black ${RADIUS.normal}
              bg-white ${SHADOWS.small}
              text-orange-500
            `}>
                            <ChatBubbleIcon />
                        </div>
                        <p className="text-black font-black mb-1">
                            Discutez avec votre document
                        </p>
                        <p className="text-black font-medium text-sm">
                            Posez des questions ou demandez des explications
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages
                            // Don't render empty assistant messages (show typing indicator instead)
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

                        {/* Typing indicator - shows when streaming but content is empty */}
                        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content.trim() === '' && (
                            <div className={`
                                flex items-center gap-3 p-4
                                ${BORDERS.normal} border-black ${RADIUS.normal}
                                bg-white ${SHADOWS.small}
                            `}>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-sm text-black font-medium">
                                    {searchStatus.isSearching
                                        ? `Recherche: ${searchStatus.query || '...'}`
                                        : 'Réflexion...'}
                                </span>
                            </div>
                        )}

                        {/* Search indicator - shows during RAG search */}
                        {searchStatus.isSearching && messages[messages.length - 1]?.content.trim() !== '' && (
                            <div className={`
                                flex items-center gap-3 p-4
                                ${BORDERS.normal} border-black ${RADIUS.normal}
                                bg-orange-50 ${SHADOWS.small}
                            `}>
                                <div className="flex items-center gap-2">
                                    <SearchIcon />
                                    <span className="font-bold text-sm">RECHERCHE</span>
                                </div>
                                {searchStatus.query && (
                                    <span className="text-sm text-slate-600 truncate">
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

                {/* Error display */}
                {error && (
                    <div className={`
            mt-4 p-4 ${BORDERS.normal} border-red-500 ${RADIUS.normal}
            bg-red-50 text-red-700 font-bold text-sm
          `}>
                        Erreur: {error}
                    </div>
                )}
            </div>

            {/* Pending action indicator */}
            {pendingAction && (
                <div className={`
          px-5 py-3 ${BORDERS.thin} border-x-0 border-black
          bg-orange-100 text-sm
        `}>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-black truncate max-w-[250px]">
                            « {pendingAction.selected_text?.slice(0, 40)}... »
                        </span>
                        <button
                            onClick={() => setPendingAction(null)}
                            className={`
                text-xs font-bold px-2 py-1
                ${BORDERS.thin} border-black ${RADIUS.subtle}
                hover:bg-red-100 hover:text-red-600 ${TRANSITIONS.fast}
              `}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Input area */}
            <form
                onSubmit={handleSubmit}
                className={`
          p-5 ${BORDERS.normal} border-b-0 border-x-0 border-black
          bg-white
        `}
            >
                <div className="flex gap-3 items-center">
                    <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Posez une question..."
                        disabled={isStreaming}
                        rows={2}
                        className="flex-1 text-sm"
                    />
                    <Button
                        type="submit"
                        disabled={!inputValue.trim() || isStreaming}
                        className="p-4 h-auto"
                    >
                        {isStreaming ? (
                            <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <SendIcon />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
