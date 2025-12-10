/**
 * Tests for AuthContext and AuthProvider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';
import { useContext } from 'react';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Simple wrapper without router
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// Hook to access AuthContext
function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('starts with null user when no token', async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('fetches user when token exists in localStorage', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears token if user fetch fails', async () => {
      localStorage.setItem('token', 'invalid-token');

      server.use(
        http.get('http://localhost:8000/api/auth/users/me', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('login', () => {
    it('authenticates user with valid credentials', async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({
          username: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });

    it('throws error with invalid credentials', async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({
            username: 'wrong@example.com',
            password: 'wrongpassword',
          });
        })
      ).rejects.toThrow('Email ou mot de passe incorrect');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles server errors gracefully', async () => {
      server.use(
        http.post('http://localhost:8000/api/auth/jwt/login', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({
            username: 'test@example.com',
            password: 'password123',
          });
        })
      ).rejects.toThrow('Erreur serveur');
    });
  });

  describe('register', () => {
    it('registers and auto-logs in new user', async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock the sequence: register -> login -> fetch user
      server.use(
        http.post('http://localhost:8000/api/auth/jwt/login', async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          if (params.get('username') === 'newuser@example.com') {
            return HttpResponse.json({
              access_token: 'new-user-token',
              token_type: 'bearer',
            });
          }
          return new HttpResponse(null, { status: 400 });
        })
      );

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'newpassword123',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).not.toBeNull();
    });

    it('throws error when user already exists', async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password123',
          });
        })
      ).rejects.toThrow('Un compte avec cet email existe déjà');
    });

    it('handles validation errors', async () => {
      server.use(
        http.post('http://localhost:8000/api/auth/register', () => {
          return new HttpResponse(
            JSON.stringify({ detail: 'Invalid email format' }),
            { status: 422 }
          );
        })
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register({
            email: 'invalid-email',
            password: 'password123',
          });
        })
      ).rejects.toThrow("Format d'email ou mot de passe invalide");
    });
  });

  describe('logout', () => {
    it('clears user state and token', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/');

      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('updateApiKey', () => {
    it('updates API key and refreshes user data', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      server.use(
        http.patch('http://localhost:8000/api/auth/users/me', () => {
          return HttpResponse.json({
            id: 1,
            email: 'test@example.com',
            is_active: true,
            is_superuser: false,
            is_verified: true,
            has_api_key: true,
            is_demo_user: false,
            demo_expires_at: null,
          });
        }),
        http.get('http://localhost:8000/api/auth/users/me', () => {
          return HttpResponse.json({
            id: 1,
            email: 'test@example.com',
            is_active: true,
            is_superuser: false,
            is_verified: true,
            has_api_key: true,
            is_demo_user: false,
            demo_expires_at: null,
          });
        })
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateApiKey('new-api-key');
      });

      expect(result.current.user?.has_api_key).toBe(true);
    });
  });

  describe('testApiKey', () => {
    it('returns success when API key is valid', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let testResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        testResult = await result.current.testApiKey();
      });

      expect(testResult?.success).toBe(true);
      expect(testResult?.message).toBe('API key is valid');
    });
  });

  describe('deleteAccount', () => {
    it('deletes account and clears state', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/');

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('changePassword', () => {
    it('changes password after verifying current password', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      // Mock login verification
      server.use(
        http.post('http://localhost:8000/api/auth/jwt/login', async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          if (params.get('password') === 'currentpass') {
            return HttpResponse.json({
              access_token: 'temp-token',
              token_type: 'bearer',
            });
          }
          return new HttpResponse(null, { status: 400 });
        })
      );

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).not.toBeNull();
      });

      await act(async () => {
        await result.current.changePassword('currentpass', 'newpassword123');
      });

      // If no error, password change succeeded
    });

    it('throws error when current password is wrong', async () => {
      localStorage.setItem('token', 'mock-jwt-token');

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.changePassword('wrongpass', 'newpassword123');
        })
      ).rejects.toThrow('Le mot de passe actuel est incorrect');
    });
  });
});
