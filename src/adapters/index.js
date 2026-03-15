/**
 * Adapter registry.
 *
 * In development (REACT_APP_USE_MOCK=true), mock adapters are used.
 * In production, real adapters are instantiated with auth tokens from
 * the user's connected account credentials.
 *
 * To register a new platform:
 *   1. Create src/adapters/yourplatform.adapter.js
 *   2. Add an entry to PLATFORM_REGISTRY below
 *   3. That's it. All modules discover platforms through this registry.
 */

import {
  mockUberAdapter,
  mockLyftAdapter,
  mockBoltAdapter,
  mockViaAdapter,
} from './mock.adapter';
import { UberAdapter } from './uber.adapter';

const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';

// ─── Platform registry ───────────────────────────────────────────────────────
// Each entry describes a platform and how to instantiate its adapter.

export const PLATFORM_REGISTRY = [
  {
    id: 'uber',
    name: 'Uber',
    color: '#276EF1',
    logoText: 'U',
    available: true,
    createAdapter: (token) =>
      USE_MOCK ? mockUberAdapter : new UberAdapter(token),
  },
  {
    id: 'lyft',
    name: 'Lyft',
    color: '#FF00BF',
    logoText: 'L',
    available: true,
    createAdapter: () => mockLyftAdapter,    // real adapter: TODO
  },
  {
    id: 'bolt',
    name: 'Bolt',
    color: '#34D186',
    logoText: 'B',
    available: true,
    createAdapter: () => mockBoltAdapter,    // real adapter: TODO
  },
  {
    id: 'via',
    name: 'Via',
    color: '#FF6B35',
    logoText: 'V',
    available: true,
    createAdapter: () => mockViaAdapter,     // real adapter: TODO
  },
];

// ─── Adapter cache ───────────────────────────────────────────────────────────
// Adapters are singletons per session. Re-used across checks.

const adapterCache = new Map();

/**
 * Get (or create) the adapter instance for a platform.
 * @param {string} platformId
 * @param {string} [authToken]
 * @returns {BaseAdapter}
 */
export function getAdapter(platformId, authToken) {
  if (!adapterCache.has(platformId)) {
    const platform = PLATFORM_REGISTRY.find(p => p.id === platformId);
    if (!platform) throw new Error(`Unknown platform: ${platformId}`);
    adapterCache.set(platformId, platform.createAdapter(authToken));
  }
  return adapterCache.get(platformId);
}

/**
 * Get adapters for an array of platform IDs.
 * @param {string[]} platformIds
 * @returns {BaseAdapter[]}
 */
export function getAdapters(platformIds) {
  return platformIds.map(id => getAdapter(id));
}
