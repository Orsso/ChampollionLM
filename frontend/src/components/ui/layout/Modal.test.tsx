/**
 * Tests for Modal component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

// Mock gsap
vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn(),
    fromTo: vi.fn(),
  },
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Fermer'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    // Click the overlay (first element with fixed class)
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Modal content'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders footer when provided', () => {
    render(
      <Modal {...defaultProps} footer={<button>Save</button>} />
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders headerRight when provided', () => {
    render(
      <Modal {...defaultProps} headerRight={<span>Extra</span>} />
    );

    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('renders custom title element', () => {
    render(
      <Modal
        {...defaultProps}
        title={<h3 data-testid="custom-title">Custom Title</h3>}
      />
    );

    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });

  it('applies custom maxWidth', () => {
    const { container } = render(
      <Modal {...defaultProps} maxWidth="max-w-md" />
    );

    expect(container.querySelector('.max-w-md')).toBeInTheDocument();
  });

  it('has accessible close button', () => {
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Fermer');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe('BUTTON');
  });
});
