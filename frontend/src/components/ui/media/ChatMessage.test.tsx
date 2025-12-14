import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import { describe, it, expect } from 'vitest';

describe('ChatMessage', () => {
    it('renders user message correctly', () => {
        render(<ChatMessage role="user" content="Hello world" />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders assistant message with HTML content', () => {
        render(<ChatMessage role="assistant" content="**Bold** text" />);
        // useMarkdown should convert **Bold** to strong tag
        // Testing that it eventually renders the text
        expect(screen.getByText('Bold')).toBeInTheDocument();
        expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('renders metadata badges', () => {
        const metadata = { action: 'explain' };
        render(<ChatMessage role="assistant" content="Explained" metadata={metadata} />);
        expect(screen.getByText('EXPLAIN')).toBeInTheDocument();
    });

    it('handles streaming state', () => {
        const { container } = render(<ChatMessage role="assistant" content="Streaming..." isStreaming={true} />);
        expect(container.querySelector('.animate-\\[shimmer_1\\.5s_infinite\\]')).toBeInTheDocument();
    });
});
