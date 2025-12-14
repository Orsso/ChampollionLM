import { render, screen } from '@testing-library/react';
import { ProjectChatPanel } from './ProjectChatPanel';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('../../hooks/useProjectChat', () => ({
    useProjectChat: () => ({
        messages: [],
        isStreaming: false,
        searchStatus: { isSearching: false },
        error: null,
        sendMessage: vi.fn(),
        isLoading: false,
        sessions: [],
        currentSession: null,
        createSession: vi.fn(),
        selectSession: vi.fn(),
        deleteSession: vi.fn(),
        pendingTitleAnimation: null,
        clearPendingTitle: vi.fn(),
    })
}));

vi.mock('../../hooks/useConfirmDelete', () => ({
    useConfirmDelete: () => ({
        handleDelete: vi.fn(),
        isConfirmingId: () => false,
    })
}));

// Mock child components that might use contexts not present in test
vi.mock('../ui/media/ChatMessage', () => ({
    ChatMessage: () => <div data-testid="chat-message">Message</div>
}));

import type { Source } from '../../types';

describe('ProjectChatPanel', () => {
    const mockSources: Source[] = [
        { id: 1, title: 'Source 1', type: 'document', content: 'test', processed_content: 'test', has_processed_content: true, created_at: '', project_id: 1, date_added: '' } as unknown as Source
    ];

    it('renders without crashing', () => {
        render(<ProjectChatPanel projectId={1} sources={mockSources} />);
        // i18n uses fallbackLng 'fr' so we get French text
        expect(screen.getByPlaceholderText(/question/i)).toBeInTheDocument();
        expect(screen.getByText(/Conversations/i)).toBeInTheDocument();
    });

    it('shows empty state when no messages', () => {
        render(<ProjectChatPanel projectId={1} sources={mockSources} />);
        // Check for empty state - panel renders with sources
        expect(screen.getAllByText(/sources/i).length).toBeGreaterThan(0);
    });
});
