/**
 * Chat API types and hook for project conversations with session support
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
        sources_used?: string[];
        chunks_found?: ChunkPreview[];
    } | null;
}

export interface ChatSession {
    id: number;
    project_id: number;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
}

export interface ProjectChatHistoryResponse {
    project_id: number;
    messages: ChatMessage[];
    total_count: number;
}

export interface ChatSessionListResponse {
    sessions: ChatSession[];
    total_count: number;
}

export interface ChatOptions {
    action?: 'explain' | 'expand' | 'summarize' | 'refine';
    selected_text?: string;
    source_ids?: number[];
}

// Re-export for convenience
export type { ChunkPreview, SearchStatus };

interface UseProjectChatReturn {
    // Messages
    messages: ChatMessage[];
    isStreaming: boolean;
    searchStatus: SearchStatus;
    error: string | null;
    sendMessage: (message: string, options?: ChatOptions) => Promise<void>;
    isLoading: boolean;
    // Sessions
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    createSession: (title?: string) => Promise<ChatSession | null>;
    selectSession: (sessionId: number | null) => Promise<void>;
    deleteSession: (sessionId: number) => Promise<void>;
    loadSessions: () => Promise<void>;
    // Title animation
    pendingTitleAnimation: { sessionId: number; title: string } | null;
    clearPendingTitle: () => void;
}

/**
 * Hook for managing project chat conversations with session support
 */
export function useProjectChat(projectId: number | string): UseProjectChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchStatus, setSearchStatus] = useState<SearchStatus>({ isSearching: false });
    const abortControllerRef = useRef<AbortController | null>(null);

    // Session state
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const currentSessionRef = useRef<ChatSession | null>(null);

    // Title animation state
    const [pendingTitleAnimation, setPendingTitleAnimation] = useState<{ sessionId: number; title: string } | null>(null);

    const clearPendingTitle = useCallback(() => {
        setPendingTitleAnimation(null);
    }, []);

    // Keep ref in sync with state
    useEffect(() => {
        currentSessionRef.current = currentSession;
    }, [currentSession]);

    // Load sessions list
    const loadSessions = useCallback(async () => {
        try {
            const response = await fetcher<ChatSessionListResponse>(
                `/api/projects/${projectId}/chat/sessions`
            );
            setSessions(response.sessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    }, [projectId]);

    // Load history for a session
    const loadHistory = useCallback(async (sessionId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetcher<ProjectChatHistoryResponse>(
                `/api/projects/${projectId}/chat/sessions/${sessionId}/history`
            );
            setMessages(response.messages);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load chat history';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Create new session
    const createSession = useCallback(async (title: string = 'Nouvelle conversation'): Promise<ChatSession | null> => {
        try {
            const response = await fetcher<ChatSession>(
                `/api/projects/${projectId}/chat/sessions`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title }),
                }
            );
            setSessions(prev => [response, ...prev]);
            setCurrentSession(response);
            setMessages([]);
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create session';
            setError(message);
            return null;
        }
    }, [projectId]);

    // Select a session
    const selectSession = useCallback(async (sessionId: number | null) => {
        if (sessionId === null) {
            setCurrentSession(null);
            setMessages([]);
        } else {
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                setCurrentSession(session);
                await loadHistory(sessionId);
            }
        }
    }, [sessions, loadHistory]);

    // Delete a session
    const deleteSession = useCallback(async (sessionId: number) => {
        try {
            await fetcher<void>(
                `/api/projects/${projectId}/chat/sessions/${sessionId}`,
                { method: 'DELETE' }
            );
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSession?.id === sessionId) {
                setCurrentSession(null);
                setMessages([]);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete session';
            setError(message);
        }
    }, [projectId, currentSession]);

    // Load sessions and auto-select first one on mount
    useEffect(() => {
        const initialize = async () => {
            try {
                const response = await fetcher<ChatSessionListResponse>(
                    `/api/projects/${projectId}/chat/sessions`
                );
                setSessions(response.sessions);

                // Auto-select first session if available, otherwise start empty
                if (response.sessions.length > 0) {
                    const firstSession = response.sessions[0];
                    setCurrentSession(firstSession);
                    await loadHistory(firstSession.id);
                } else {
                    // No sessions - start with empty state
                    setMessages([]);
                }
            } catch (err) {
                console.error('Failed to initialize sessions:', err);
            }
        };

        initialize();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [projectId, loadHistory]);

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
            message_metadata: options ? {
                action: options.action,
                selected_text: options.selected_text
            } : null,
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

            // Auto-create session if none exists (use ref to avoid stale closure)
            let sessionIdToUse = currentSessionRef.current?.id ?? null;
            if (!sessionIdToUse) {
                const newSession = await fetcher<ChatSession>(
                    `/api/projects/${projectId}/chat/sessions`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: 'Nouvelle conversation' }),
                    }
                );
                setSessions(prev => [newSession, ...prev]);
                setCurrentSession(newSession);
                sessionIdToUse = newSession.id;
            }

            const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message,
                    action: options?.action,
                    selected_text: options?.selected_text,
                    source_ids: options?.source_ids,
                    session_id: sessionIdToUse,
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

                        const { events, cleanContent } = parseAndCleanData(data);

                        for (const event of events) {
                            if (event.type === 'search_start') {
                                const payload = event.payload as { query?: string } | undefined;
                                setSearchStatus({ isSearching: true, query: payload?.query });
                            } else if (event.type === 'search_complete') {
                                const payload = event.payload as { sources?: string[]; chunks?: ChunkPreview[] } | undefined;
                                setSearchStatus({ isSearching: false, query: undefined, chunks: payload?.chunks });
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
                            } else if (event.type === 'title_generated') {
                                const payload = event.payload as { session_id?: number; title?: string } | undefined;
                                if (payload?.session_id && payload?.title) {
                                    // Update session in list
                                    setSessions(prev =>
                                        prev.map(s =>
                                            s.id === payload.session_id
                                                ? { ...s, title: payload.title! }
                                                : s
                                        )
                                    );
                                    // Update current session if it's the one being updated
                                    setCurrentSession(prev => {
                                        if (prev && prev.id === payload.session_id) {
                                            return { ...prev, title: payload.title! };
                                        }
                                        return prev;
                                    });
                                    // Trigger animation
                                    setPendingTitleAnimation({ sessionId: payload.session_id, title: payload.title });
                                }
                            }
                        }

                        if (cleanContent) {
                            accumulatedContent += cleanContent;
                        }

                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantId
                                    ? { ...msg, content: accumulatedContent }
                                    : msg
                            )
                        );
                    }
                }
            }

            // Note: We don't call loadHistory here anymore to avoid flicker
            // The streaming already updates messages in real-time
            await loadSessions(); // Refresh session list to update message counts
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
    }, [projectId, currentSession, loadSessions]);

    return {
        messages,
        isStreaming,
        searchStatus,
        error,
        sendMessage,
        isLoading,
        // Sessions
        sessions,
        currentSession,
        createSession,
        selectSession,
        deleteSession,
        loadSessions,
        // Title animation
        pendingTitleAnimation,
        clearPendingTitle,
    };
}
