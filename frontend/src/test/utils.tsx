/**
 * Test utilities and wrappers for React Testing Library.
 */
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import type { ReactElement, ReactNode } from 'react';
import { SWRConfig } from 'swr';

/**
 * Custom wrapper that provides all necessary context providers.
 */
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <AuthProvider>{children}</AuthProvider>
      </SWRConfig>
    </BrowserRouter>
  );
}

/**
 * Custom render function with all providers.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Wrapper without AuthProvider for testing components in isolation.
 */
function RouterOnlyWrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    </BrowserRouter>
  );
}

/**
 * Render without AuthProvider.
 */
function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: RouterOnlyWrapper, ...options });
}

/**
 * Set up authenticated state in localStorage.
 */
function setupAuthenticatedUser(token = 'mock-jwt-token') {
  localStorage.setItem('token', token);
}

/**
 * Clear authenticated state.
 */
function clearAuthenticatedUser() {
  localStorage.removeItem('token');
}

/**
 * Wait for async state updates.
 */
async function waitForAsync(ms = 100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-export everything from Testing Library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Export custom utilities
export {
  customRender as render,
  renderWithRouter,
  AllProviders,
  RouterOnlyWrapper,
  setupAuthenticatedUser,
  clearAuthenticatedUser,
  waitForAsync,
};
