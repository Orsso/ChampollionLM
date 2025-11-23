/**
 * API Client Configuration
 * Base URL and fetcher functions for API calls
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get auth token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Set auth token in localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * Remove auth token from localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

/**
 * Base fetcher with auth headers
 */
export async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle 204 No Content (no body to parse)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Fetcher for multipart/form-data (file uploads)
 */
export async function uploadFetcher<T>(url: string, formData: FormData): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle 204 No Content (no body to parse)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * SWR fetcher wrapper
 */
export const swrFetcher = <T>(url: string): Promise<T> => fetcher<T>(url);

// Document API functions
export const deleteDocument = async (projectId: number, documentId: number): Promise<void> => {
  return fetcher<void>(`/api/projects/${projectId}/documents/${documentId}`, {
    method: 'DELETE',
  });
};

export const updateDocument = async (projectId: number, documentId: number, title: string): Promise<void> => {
  return fetcher<void>(`/api/projects/${projectId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
};
