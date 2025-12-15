/**
 * Tests for ChatStatusIndicator component.
 * 
 * Tests use language-agnostic matchers since i18n may use
 * browser language detection in the test environment.
 */
import { render, screen } from '@testing-library/react';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { describe, it, expect } from 'vitest';

describe('ChatStatusIndicator', () => {
    it('renders searching state', () => {
        render(<ChatStatusIndicator isSearching={true} query="test" isTyping={false} />);
        // Match English "Searching documents" or French "Recherche de documents"
        expect(screen.getByText(/Searching documents|Recherche de documents/i)).toBeInTheDocument();
        expect(screen.getByText(/test/)).toBeInTheDocument();
    });

    it('renders generating state', () => {
        render(<ChatStatusIndicator isSearching={false} isTyping={true} />);
        // Match English "Responding" or French "Réponse en cours"
        expect(screen.getByText(/Responding|Réponse en cours/i)).toBeInTheDocument();
    });

    it('renders nothing when idle', () => {
        const { container } = render(<ChatStatusIndicator isSearching={false} isTyping={false} />);
        expect(container).toBeEmptyDOMElement();
    });
});
