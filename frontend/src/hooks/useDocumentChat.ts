/**
 * Chat API types and hook for document conversations
 * Supports tool call events for RAG search visibility
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE_URL, getToken, fetcher } from '../lib/api';
import { parseAndCleanData, type ChunkPreview, type SearchStatus } from '../lib/chatUtils';

// Types
export interface ChatMessage {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
    message_metadata?: {
        action?: string;
        selected_text?: string;
    } | null;
}

export interface ChatHistoryResponse {
    document_id: number;
    messages: ChatMessage[];
    total_count: number;
}

export interface ChatOptions {
    action?: 'explain' | 'expand' | 'summarize' | 'refine';
    selected_text?: string;
}

// Re-export for convenience
export type { ChunkPreview, SearchStatus };

interface UseDocumentChatReturn {
    messages: ChatMessage[];
    isStreaming: boolean;
    searchStatus: SearchStatus;
    error: string | null;
    sendMessage: (message: string, options?: ChatOptions) => Promise<void>;
    loadHistory: () => Promise<void>;
    clearHistory: () => Promise<void>;
    isLoading: boolean;
}

/**
 * Hook for managing document chat conversations
 */
export function useDocumentChat(documentId: number): UseDocumentChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchStatus, setSearchStatus] = useState<SearchStatus>({ isSearching: false });
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load chat history on mount
    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetcher<ChatHistoryResponse>(
                `/api/documents/${documentId}/chat/history`
            );
            setMessages(response.messages);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load chat history';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [documentId]);

    // Load history on mount and when documentId changes
    useEffect(() => {
        loadHistory();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadHistory]);

    // Send message and stream response
    const sendMessage = useCallback(async (message: string, options?: ChatOptions) => {
        setError(null);
        setIsStreaming(true);
        setSearchStatus({ isSearching: false });

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
            message_metadata: options ? { action: options.action, selected_text: options.selected_text } : null,
        };
        setMessages(prev => [...prev, userMessage]);

        // Add placeholder for assistant message
        const assistantId = Date.now() + 1;
        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const token = getToken();
            abortControllerRef.current = new AbortController();

            const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message,
                    action: options?.action,
                    selected_text: options?.selected_text,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            break;
                        }

                        if (data.startsWith('[ERROR]')) {
                            throw new Error(data.slice(8));
                        }

                        // Parse tool events and extract clean content
                        const { events, cleanContent } = parseAndCleanData(data);



                        // Handle tool events
                        for (const event of events) {
                            if (event.type === 'search_start') {
                                const payload = event.payload as { query?: string } | undefined;
                                setSearchStatus({ isSearching: true, query: payload?.query });
                            } else if (event.type === 'search_complete') {
                                const payload = event.payload as { sources?: string[]; chunks?: ChunkPreview[] } | undefined;
                                setSearchStatus({ isSearching: false, query: undefined, chunks: payload?.chunks });
                                // Add sources and chunks to the current assistant message metadata
                                if (payload?.sources && payload.sources.length > 0) {
                                    setMessages(prev =>
                                        prev.map(msg =>
                                            msg.id === assistantId
                                                ? {
                                                    ...msg,
                                                    message_metadata: {
                                                        ...msg.message_metadata,
                                                        sources_used: payload.sources,
                                                        chunks_found: payload.chunks
                                                    }
                                                }
                                                : msg
                                        )
                                    );
                                }
                            }
                        }

                        // Only add clean content (without tool markers)
                        if (cleanContent) {
                            accumulatedContent += cleanContent;
                        }

                        // Update the assistant message with new content (preserve metadata)
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantId
                                    ? { ...msg, content: accumulatedContent }  // metadata preserved via spread
                                    : msg
                            )
                        );
                    }
                }
            }

            // Reload history to get proper IDs and persisted sources
            await loadHistory();
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            const message = err instanceof Error ? err.message : 'Failed to send message';
            setError(message);
            setMessages(prev => prev.filter(msg => msg.id !== assistantId));
        } finally {
            setIsStreaming(false);
            setSearchStatus({ isSearching: false });
            abortControllerRef.current = null;
        }
    }, [documentId, loadHistory]);

    // Clear chat history
    const clearHistory = useCallback(async () => {
        setError(null);
        try {
            await fetcher<void>(`/api/documents/${documentId}/chat/history`, {
                method: 'DELETE',
            });
            setMessages([]);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to clear history';
            setError(message);
        }
    }, [documentId]);

    return {
        messages,
        isStreaming,
        searchStatus,
        error,
        sendMessage,
        loadHistory,
        clearHistory,
        isLoading,
    };
}
