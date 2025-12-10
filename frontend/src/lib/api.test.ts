/**
 * Tests for API client functions.
 *
 * These tests mock fetch directly to test the API functions in isolation,
 * without MSW interference.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  getToken,
  setToken,
  removeToken,
  fetcher,
  uploadFetcher,
  swrFetcher,
  deleteDocument,
  updateDocument,
  API_BASE_URL,
} from './api';
import { server } from '../test/mocks/server';

// Disable MSW for these tests since we're mocking fetch directly
beforeAll(() => {
  server.close();
});

afterAll(() => {
  server.listen();
});

// Mock fetch globally
const mockFetch = vi.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('Token Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getToken returns null when no token exists', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores token in localStorage', () => {
    setToken('test-token');
    expect(localStorage.getItem('token')).toBe('test-token');
  });

  it('getToken returns stored token', () => {
    localStorage.setItem('token', 'my-token');
    expect(getToken()).toBe('my-token');
  });

  it('removeToken clears token from localStorage', () => {
    localStorage.setItem('token', 'my-token');
    removeToken();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('fetcher', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
    mockLocation.href = '';
  });

  it('makes request with correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await fetcher('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/test`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await fetcher('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    );
  });

  it('does not include Authorization header when no token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await fetcher('/api/test');

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it('returns parsed JSON response', async () => {
    const responseData = { id: 1, name: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
    });

    const result = await fetcher('/api/test');

    expect(result).toEqual(responseData);
  });

  it('handles 204 No Content responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await fetcher('/api/test');

    expect(result).toBeUndefined();
  });

  it('redirects to login on 401 response', async () => {
    localStorage.setItem('token', 'expired-token');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Unauthorized' }),
    });

    await expect(fetcher('/api/test')).rejects.toThrow();

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockLocation.href).toBe('/login');
  });

  it('throws error with detail message on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Bad request' }),
    });

    await expect(fetcher('/api/test')).rejects.toThrow('Bad request');
  });

  it('throws generic error when no detail provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Parse error')),
    });

    await expect(fetcher('/api/test')).rejects.toThrow('An error occurred');
  });

  it('passes through custom options', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await fetcher('/api/test', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      })
    );
  });
});

describe('uploadFetcher', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
    mockLocation.href = '';
  });

  it('sends FormData without Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.txt');

    await uploadFetcher('/api/upload', formData);

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Content-Type']).toBeUndefined();
  });

  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('token', 'my-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const formData = new FormData();
    await uploadFetcher('/api/upload', formData);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    );
  });

  it('uses POST method', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await uploadFetcher('/api/upload', new FormData());

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('handles 401 response with redirect', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(uploadFetcher('/api/upload', new FormData())).rejects.toThrow();

    expect(mockLocation.href).toBe('/login');
  });

  it('handles 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await uploadFetcher('/api/upload', new FormData());

    expect(result).toBeUndefined();
  });
});

describe('swrFetcher', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('wraps fetcher for SWR compatibility', async () => {
    const responseData = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
    });

    const result = await swrFetcher('/api/test');

    expect(result).toEqual(responseData);
  });
});

describe('Document API functions', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    mockFetch.mockReset();
  });

  describe('deleteDocument', () => {
    it('calls DELETE endpoint with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteDocument(1, 2);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/projects/1/documents/2`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('updateDocument', () => {
    it('calls PATCH endpoint with title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await updateDocument(1, 2, 'New Title');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/projects/1/documents/2`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ title: 'New Title' }),
        })
      );
    });
  });
});
