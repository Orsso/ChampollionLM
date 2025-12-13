import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { describe, it, expect, vi } from 'vitest';

// Component that throws an error
const Bomb = () => {
    throw new Error('Boom');
};

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Safe</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe')).toBeInTheDocument();
    });

    it('renders error UI when error occurs', () => {
        // Prevent console.error from cluttering output during test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/Boom/)).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});
