/**
 * Tests for useSources and source API functions.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useSources,
  createSource,
  deleteSource,
  updateSource,
  importYouTubeSource,
  uploadAudioSource,
} from './useSources';
import { AuthProvider } from '../contexts/AuthContext';
import { SWRConfig } from 'swr';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}

describe('useSources', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('fetches sources for a project', async () => {
    const { result } = renderHook(() => useSources(1), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sources).toBeDefined();
    expect(Array.isArray(result.current.sources)).toBe(true);
    expect(result.current.sources?.length).toBeGreaterThan(0);
  });

  it('returns empty when project ID is undefined', async () => {
    const { result } = renderHook(() => useSources(undefined), { wrapper });

    // Wait for auth to settle
    await waitFor(() => {
      expect(result.current.sources).toBeUndefined();
    });
  });

  it('returns empty when not authenticated', async () => {
    localStorage.clear();

    const { result } = renderHook(() => useSources(1), { wrapper });

    expect(result.current.sources).toBeUndefined();
  });

  it('provides mutate function', async () => {
    const { result } = renderHook(() => useSources(1), { wrapper });

    expect(result.current.mutate).toBeInstanceOf(Function);
  });
});

describe('createSource', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('creates a document source', async () => {
    const source = await createSource(1, {
      type: 'document',
      title: 'Test Document',
      content: 'Test content',
    });

    expect(source).toBeDefined();
    expect(source.title).toBe('Test Document');
    expect(source.type).toBe('document');
  });

  it('throws error on failure', async () => {
    server.use(
      http.post('http://localhost:8000/api/projects/1/sources', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Validation error' }),
          { status: 422 }
        );
      })
    );

    await expect(
      createSource(1, { type: 'document', title: '' })
    ).rejects.toThrow();
  });
});

describe('deleteSource', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('deletes a source', async () => {
    // Should not throw
    await deleteSource(1, 1);
  });

  it('throws error on failure', async () => {
    server.use(
      http.delete('http://localhost:8000/api/projects/1/sources/999', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Source not found' }),
          { status: 404 }
        );
      })
    );

    await expect(deleteSource(1, 999)).rejects.toThrow();
  });
});

describe('updateSource', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('updates source title', async () => {
    server.use(
      http.patch('http://localhost:8000/api/projects/1/sources/1', async ({ request }) => {
        const body = await request.json() as { title: string };
        return HttpResponse.json({
          id: 1,
          type: 'document',
          title: body.title,
          created_at: '2024-01-01T00:00:00Z',
          has_processed_content: true,
        });
      })
    );

    const source = await updateSource(1, 1, { title: 'Updated Title' });

    expect(source.title).toBe('Updated Title');
  });
});

describe('importYouTubeSource', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('imports YouTube video', async () => {
    const source = await importYouTubeSource(1, 'https://youtube.com/watch?v=dQw4w9WgXcQ');

    expect(source).toBeDefined();
    expect(source.type).toBe('youtube');
  });

  it('throws error for invalid URL', async () => {
    await expect(
      importYouTubeSource(1, 'https://example.com/not-youtube')
    ).rejects.toThrow('Invalid YouTube URL');
  });
});

describe('uploadAudioSource', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('uploads audio file', async () => {
    const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mpeg' });

    const source = await uploadAudioSource(1, file);

    expect(source).toBeDefined();
    expect(source.type).toBe('audio');
  });

  it('throws error without authentication', async () => {
    localStorage.clear();

    server.use(
      http.post('http://localhost:8000/api/projects/1/sources/audio', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });

    await expect(uploadAudioSource(1, file)).rejects.toThrow();
  });
});
