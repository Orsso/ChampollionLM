import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types';
import { fetcher, getToken, setToken as saveToken, removeToken, API_BASE_URL } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateApiKey: (apiKey: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  testApiKey: () => Promise<{ success: boolean; message: string }>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const userData = await fetcher<User>('/api/auth/users/me');
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          removeToken();
          setTokenState(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/api/auth/jwt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    saveToken(data.access_token);
    setTokenState(data.access_token);

    // Fetch user data
    const userData = await fetcher<User>('/api/auth/users/me');
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Registration failed: ${response.status} - ${errorText}`);
    }
    
    await response.json();
    
    // After registration, auto-login
    await login({ username: data.email, password: data.password });
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    window.location.href = '/';
  };

  const updateApiKey = async (apiKey: string) => {
    await fetcher('/api/auth/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ api_key: apiKey }),
    });
    // Refresh user data to update has_api_key
    const userData = await fetcher<User>('/api/auth/users/me');
    setUser(userData);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    // First verify current password by attempting to login
    try {
      const formData = new URLSearchParams();
      formData.append('username', user?.email || '');
      formData.append('password', currentPassword);

      const response = await fetch(`${API_BASE_URL}/api/auth/jwt/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Le mot de passe actuel est incorrect');
      }
    } catch {
      throw new Error('Le mot de passe actuel est incorrect');
    }

    // Update password
    await fetcher('/api/auth/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword }),
    });
  };

  const testApiKey = async (): Promise<{ success: boolean; message: string }> => {
    const result = await fetcher<{ success: boolean; message: string }>('/api/auth/test-api-key', {
      method: 'POST',
    });
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateApiKey,
        changePassword,
        testApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


