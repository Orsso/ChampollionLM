/**
 * Vitest setup file for frontend tests.
 *
 * Configures:
 * - jest-dom matchers for DOM assertions
 * - MSW server for API mocking
 * - i18n for translations
 * - Global test utilities
 */
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import { server } from './mocks/server';

// Increase default timeout for async utilities (helps in CI)
configure({ asyncUtilTimeout: 5000 });

// Mock localStorage - MUST be defined before i18n import
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});


// Mock window.matchMedia for components using media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock window.location to prevent JSDOM navigation errors
const locationMock = {
  href: '',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true,
});

// MSW Server setup and i18n initialization
beforeAll(async () => {
  // Initialize i18n before tests run
  await import('../lib/i18n');
  server.listen({ onUnhandledRequest: 'warn' });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Reset localStorage between tests (but keep language setting)
beforeEach(() => {
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});
