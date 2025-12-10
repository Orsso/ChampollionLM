/**
 * MSW request handlers for API mocking.
 *
 * Provides handlers for all API endpoints used in tests.
 */
import { http, HttpResponse } from 'msw';
import type { User, Project, Source, Document } from '../../types';

// Test data factories
export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  is_active: true,
  is_superuser: false,
  is_verified: true,
  has_api_key: false,
  is_demo_user: false,
  demo_expires_at: null,
};

export const mockAdminUser: User = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  is_superuser: true,
};

export const mockProject: Project = {
  id: 1,
  title: 'Test Project',
  description: 'A test project',
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
  status_updated_at: '2024-01-01T00:00:00Z',
  sources: [],
  sources_count: 0,
  documents_count: 0,
};

export const mockSource: Source = {
  id: 1,
  type: 'document',
  title: 'Test Source',
  created_at: '2024-01-01T00:00:00Z',
  has_processed_content: true,
  processed_content: 'Test content',
  content: 'Test content',
};

export const mockAudioSource: Source = {
  id: 2,
  type: 'audio',
  title: 'Test Audio',
  created_at: '2024-01-01T00:00:00Z',
  has_processed_content: true,
  filename: 'test.mp3',
  duration_seconds: 120,
  size_bytes: 1024000,
  audio_metadata: {
    duration_seconds: 120,
    sample_rate: 44100,
    channels: 2,
    size_bytes: 1024000,
    format: 'mp3',
  },
};

export const mockDocument: Document = {
  id: 1,
  provider: 'mistral',
  title: 'Generated Notes',
  markdown: '# Test Notes\n\nThis is a test document.',
  created_at: '2024-01-01T00:00:00Z',
  type: 'cours',
};

// Default handlers
export const handlers = [
  // Auth endpoints
  http.post('http://localhost:8000/api/auth/jwt/login', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const password = params.get('password');

    if (username === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
      });
    }

    return new HttpResponse(
      JSON.stringify({ detail: 'LOGIN_BAD_CREDENTIALS' }),
      { status: 400 }
    );
  }),

  http.post('http://localhost:8000/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'existing@example.com') {
      return new HttpResponse(
        JSON.stringify({ detail: 'REGISTER_USER_ALREADY_EXISTS' }),
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { ...mockUser, email: body.email },
      { status: 201 }
    );
  }),

  http.get('http://localhost:8000/api/auth/users/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(mockUser);
  }),

  http.patch('http://localhost:8000/api/auth/users/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;

    // Update user based on request body
    const updatedUser = { ...mockUser };
    if (body.api_key) {
      updatedUser.has_api_key = true;
    }

    return HttpResponse.json(updatedUser);
  }),

  http.delete('http://localhost:8000/api/auth/users/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.post('http://localhost:8000/api/auth/test-api-key', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({ success: true, message: 'API key is valid' });
  }),

  // Projects endpoints
  http.get('http://localhost:8000/api/projects', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([mockProject]);
  }),

  http.get('http://localhost:8000/api/projects/:projectId', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const projectId = Number(params.projectId);
    if (projectId === 999) {
      return new HttpResponse(
        JSON.stringify({ detail: 'Project not found' }),
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockProject,
      id: projectId,
      sources: [mockSource],
      sources_count: 1,
    });
  }),

  http.post('http://localhost:8000/api/projects', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as { title: string; description?: string };

    return HttpResponse.json(
      {
        ...mockProject,
        id: 2,
        title: body.title,
        description: body.description || null,
      },
      { status: 201 }
    );
  }),

  http.patch('http://localhost:8000/api/projects/:projectId', async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as { title?: string; description?: string };
    const projectId = Number(params.projectId);

    return HttpResponse.json({
      ...mockProject,
      id: projectId,
      ...body,
    });
  }),

  http.delete('http://localhost:8000/api/projects/:projectId', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const projectId = Number(params.projectId);
    if (projectId === 999) {
      return new HttpResponse(
        JSON.stringify({ detail: 'Project not found' }),
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // Sources endpoints
  http.get('http://localhost:8000/api/projects/:projectId/sources', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([mockSource, mockAudioSource]);
  }),

  http.post('http://localhost:8000/api/projects/:projectId/sources', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as { title: string; type: string; content?: string };

    return HttpResponse.json(
      {
        ...mockSource,
        id: 3,
        title: body.title,
        type: body.type,
        content: body.content,
      },
      { status: 201 }
    );
  }),

  http.post('http://localhost:8000/api/projects/:projectId/sources/audio', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(mockAudioSource, { status: 201 });
  }),

  http.post('http://localhost:8000/api/projects/:projectId/sources/youtube', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as { url: string };

    if (!body.url.includes('youtube.com') && !body.url.includes('youtu.be')) {
      return new HttpResponse(
        JSON.stringify({ detail: 'Invalid YouTube URL' }),
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        ...mockSource,
        id: 4,
        type: 'youtube',
        title: 'YouTube Video',
        youtube_metadata: {
          video_id: 'dQw4w9WgXcQ',
          video_title: 'Test Video',
        },
      },
      { status: 201 }
    );
  }),

  http.delete('http://localhost:8000/api/projects/:projectId/sources/:sourceId', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // Documents endpoints
  http.get('http://localhost:8000/api/projects/:projectId/documents', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([mockDocument]);
  }),

  http.post('http://localhost:8000/api/projects/:projectId/documents', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as { provider: string; title?: string; type?: string };

    return HttpResponse.json(
      {
        ...mockDocument,
        id: 2,
        provider: body.provider,
        title: body.title || null,
        type: body.type || 'cours',
      },
      { status: 201 }
    );
  }),

  http.delete('http://localhost:8000/api/projects/:projectId/documents/:documentId', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // Token estimation endpoint
  http.post('http://localhost:8000/api/projects/:projectId/token-estimation', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      total_tokens: 1500,
      formatted_count: '1.5K',
      context_percentage: 15,
      context_limit: 10000,
      source_count: 2,
    });
  }),

  // Admin endpoints
  http.get('http://localhost:8000/api/admin/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    // In real scenario, would check if user is admin
    return HttpResponse.json([
      { ...mockUser, created_at: '2024-01-01T00:00:00Z', demo_access: null },
      { ...mockAdminUser, created_at: '2024-01-01T00:00:00Z', demo_access: null },
    ]);
  }),

  http.get('http://localhost:8000/api/admin/demo-access', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([]);
  }),
];
