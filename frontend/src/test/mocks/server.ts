/**
 * MSW server configuration for Node.js (Vitest) environment.
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
