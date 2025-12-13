import { render, screen } from '@testing-library/react';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { describe, it, expect } from 'vitest';

describe('ChatStatusIndicator', () => {
    it('renders searching state', () => {
        render(<ChatStatusIndicator isSearching={true} query="test" isTyping={false} />);
        expect(screen.getByText(/Recherche de documents/)).toBeInTheDocument();
        expect(screen.getByText(/test/)).toBeInTheDocument();
    });

    it('renders generating state', () => {
        render(<ChatStatusIndicator isSearching={false} isTyping={true} />);
        expect(screen.getByText(/Génération de la réponse/)).toBeInTheDocument();
    });

    it('renders nothing when idle', () => {
        const { container } = render(<ChatStatusIndicator isSearching={false} isTyping={false} />);
        expect(container).toBeEmptyDOMElement();
    });
});
