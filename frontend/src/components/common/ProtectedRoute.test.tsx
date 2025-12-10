/**
 * Tests for ProtectedRoute component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';
import type { ReactNode } from 'react';

// Mock Spinner component
vi.mock('../ui/feedback', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

function renderWithRouter(ui: ReactNode, initialEntries = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const mockAuthContext = {
  user: null as { id: number; email: string; is_active: boolean; is_superuser: boolean; is_verified: boolean; has_api_key: boolean; is_demo_user: boolean; demo_expires_at: null } | null,
  token: null as string | null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateApiKey: vi.fn(),
  changePassword: vi.fn(),
  testApiKey: vi.fn(),
  deleteAccount: vi.fn(),
};

function AuthWrapper({
  children,
  contextValue
}: {
  children: ReactNode;
  contextValue: typeof mockAuthContext
}) {
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows spinner while loading', () => {
    renderWithRouter(
      <AuthWrapper contextValue={{ ...mockAuthContext, isLoading: true }}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthWrapper>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    renderWithRouter(
      <AuthWrapper contextValue={{ ...mockAuthContext, isAuthenticated: false }}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderWithRouter(
      <AuthWrapper
        contextValue={{
          ...mockAuthContext,
          isAuthenticated: true,
          user: {
            id: 1,
            email: 'test@example.com',
            is_active: true,
            is_superuser: false,
            is_verified: true,
            has_api_key: false,
            is_demo_user: false,
            demo_expires_at: null,
          },
          token: 'mock-token',
        }}
      >
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthWrapper>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('does not render children while loading even if authenticated', () => {
    renderWithRouter(
      <AuthWrapper
        contextValue={{
          ...mockAuthContext,
          isAuthenticated: true,
          isLoading: true,
        }}
      >
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthWrapper>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
