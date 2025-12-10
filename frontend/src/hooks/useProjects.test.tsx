/**
 * Tests for useProjects and related hooks.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useProjects, useProject, useCreateProject, useDeleteProject } from './useProjects';
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

describe('useProjects', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('fetches projects when authenticated', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toBeDefined();
    expect(Array.isArray(result.current.projects)).toBe(true);
  });

  it('returns empty when not authenticated', async () => {
    localStorage.clear();

    const { result } = renderHook(() => useProjects(), { wrapper });

    // Wait for auth context to finish loading
    await waitFor(() => {
      expect(result.current.projects).toBeUndefined();
    }, { timeout: 3000 });
  });

  it('provides mutate function to refresh data', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mutate).toBeInstanceOf(Function);
  });
});

describe('useProject', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('fetches single project by ID', async () => {
    const { result } = renderHook(() => useProject(1), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.project).toBeDefined();
    expect(result.current.project?.id).toBe(1);
  });

  it('handles undefined projectId', async () => {
    const { result } = renderHook(() => useProject(undefined), { wrapper });

    // Wait for auth to settle, then check project is still undefined
    await waitFor(() => {
      expect(result.current.project).toBeUndefined();
    });
  });

  it('sets error on 404', async () => {
    server.use(
      http.get('http://localhost:8000/api/projects/999', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Project not found' }),
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useProject(999), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBeDefined();
  });
});

describe('useCreateProject', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('creates a new project', async () => {
    const { result } = renderHook(() => useCreateProject(), { wrapper });

    let createdProject;
    await act(async () => {
      createdProject = await result.current.createProject({
        title: 'New Test Project',
        description: 'Test description',
      });
    });

    expect(createdProject).toBeDefined();
    expect(createdProject?.title).toBe('New Test Project');
  });

  it('throws error on failure', async () => {
    server.use(
      http.post('http://localhost:8000/api/projects', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Validation error' }),
          { status: 422 }
        );
      })
    );

    const { result } = renderHook(() => useCreateProject(), { wrapper });

    await expect(
      act(async () => {
        await result.current.createProject({ title: '' });
      })
    ).rejects.toThrow();
  });
});

describe('useDeleteProject', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
  });

  it('deletes a project', async () => {
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    // Should not throw
    await act(async () => {
      await result.current.deleteProject(1);
    });
  });

  it('handles non-existent project', async () => {
    server.use(
      http.delete('http://localhost:8000/api/projects/999', () => {
        return new HttpResponse(
          JSON.stringify({ detail: 'Project not found' }),
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await expect(
      act(async () => {
        await result.current.deleteProject(999);
      })
    ).rejects.toThrow();
  });
});
