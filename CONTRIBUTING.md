# Contributing to RideGuard

Thanks for your interest in contributing! RideGuard is a modular, open-source project — every piece is designed to be replaceable without touching the others. This guide explains how to contribute effectively.

---

## Table of contents

- [Project philosophy](#project-philosophy)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Good first contributions](#good-first-contributions)
- [Adding a platform adapter](#adding-a-platform-adapter)
- [Working on a module](#working-on-a-module)
- [Running tests](#running-tests)
- [Pull request checklist](#pull-request-checklist)
- [Code style](#code-style)

---

## Project philosophy

1. **User consent is non-negotiable.** No booking is ever silently cancelled or modified. Every action that touches a ride must be preceded by an explicit user decision.
2. **Adapters are isolated.** Platform-specific code lives only in `src/adapters/`. Core modules must never import from a specific adapter — always go through the registry.
3. **The conflict engine is pure.** `src/lib/conflictEngine.js` has no React, no imports, no side effects. Keep it that way. It should be trivially portable to any runtime.
4. **Audit log is append-only.** Never delete or modify existing log entries. New entries only.
5. **Transparency over convenience.** If in doubt, show the user more information, not less.

---

## Getting started

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/rideguard.git
cd rideguard

# 2. Install dependencies
npm install

# 3. Start the dev server (runs in mock mode — no platform credentials needed)
npm start

# 4. Run tests
npm test
```

The app defaults to `REACT_APP_USE_MOCK=true`, which uses `src/adapters/mock.adapter.js` for all platforms. You never need real API keys to develop locally.

---

## Project structure

```
src/
├── adapters/          ← Add new platforms here
├── components/        ← Shared UI components (no business logic)
├── hooks/             ← React hooks that wrap store actions
├── lib/               ← Pure logic: conflict engine, audit log, time utils
├── modules/           ← The four main feature modules
│   ├── opt-in/        ← Module 1: enrollment
│   ├── booking/       ← Module 2: ride scanning
│   ├── conflict/      ← Module 3: overlap prompt
│   └── notify/        ← Module 4: driver dispatch
└── store/             ← Zustand global state
```

---

## Good first contributions

These are scoped, well-defined tasks ideal for first-time contributors:

| Task | File(s) | Difficulty |
|------|---------|------------|
| Implement Uber adapter | `src/adapters/uber.adapter.js` | Medium |
| Implement Lyft adapter | `src/adapters/lyft.adapter.js` | Medium |
| Add conflict engine unit tests | `src/lib/conflictEngine.test.js` | Easy |
| Add time window config UI | `src/modules/opt-in/OptInModule.jsx` | Easy |
| Add audit log export button to UI | `src/modules/notify/NotifyModule.jsx` | Easy |
| Add PWA manifest + service worker | `public/` | Medium |
| Add i18n support | All modules | Medium–Hard |
| Write E2E test with Playwright | `e2e/` (new) | Hard |

---

## Adding a platform adapter

This is the most impactful type of contribution. Here's the full process:

### 1. Create the adapter file

```bash
cp src/adapters/mock.adapter.js src/adapters/yourplatform.adapter.js
```

### 2. Implement the two required methods

Your adapter must extend `BaseAdapter` and implement:

**`getActiveRides()`** — fetches all current and upcoming rides for the authenticated user.

Returns an array of `ActiveRide` objects:

```js
{
  id: 'PLATFORM-R123',          // string — platform-native ride ID
  platform: 'yourplatform',     // string — must match platformId getter
  driver: {
    id: 'D456',                 // string
    name: 'Jane D.',            // string — first name + last initial
    vehicle: 'Toyota Prius',    // string — year/make/model optional
  },
  pickup: {
    address: '123 Main St',     // string — human-readable
    lat: 37.77,                 // number
    lng: -122.41,               // number
    estimatedTime: '2025-03-15T14:30:00Z',  // ISO 8601 string
  },
  dropoff: {
    address: 'Airport Terminal 2',
    lat: 37.62,
    lng: -122.38,
    estimatedTime: '2025-03-15T15:15:00Z',
  },
  status: 'scheduled',          // 'scheduled'|'en_route'|'arrived'|'in_progress'
  etaMinutes: 12,               // number — minutes until pickup
}
```

**`notifyDriver(rideId, message)`** — sends an informational text to the driver.

Returns a `NotifyResult`:

```js
{
  success: true,
  sentAt: '2025-03-15T14:22:00Z',   // ISO 8601
  method: 'push',                    // 'push'|'sms'|'in-app'|'mock'
  error: undefined,                  // string if success === false
}
```

### 3. Register the adapter

In `src/adapters/index.js`, add an entry to `PLATFORM_REGISTRY`:

```js
{
  id: 'yourplatform',
  name: 'YourPlatform',
  color: '#HEXCOLOR',
  logoText: 'Y',
  available: true,
  createAdapter: (token) =>
    USE_MOCK ? mockYourPlatformAdapter : new YourPlatformAdapter(token),
},
```

Also add a mock instance to `mock.adapter.js` for development use.

### 4. Add env vars

Add the required env variables to `.env.example`:

```
REACT_APP_YOURPLATFORM_CLIENT_ID=
REACT_APP_YOURPLATFORM_CLIENT_SECRET=
```

### 5. Test it

```bash
npm test src/adapters/yourplatform.adapter.test.js
```

Write at least one test for `getActiveRides()` using a mocked fetch, and one for the `ActiveRide` shape conformance.

---

## Working on a module

Each module in `src/modules/` is a self-contained React component that:
- Reads state from `useRideGuardStore`
- Dispatches actions through the store or hooks
- Never imports directly from adapters (use the registry)
- Never makes fetch calls directly (always through an adapter or hook)

Module components accept `onComplete`/`onProceed`/`onCancel` callback props from `App.jsx` for navigation — they don't control routing themselves.

---

## Running tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watchAll

# Single file
npm test src/lib/conflictEngine.test.js
```

Tests use React Testing Library + Jest (included via `react-scripts`).

---

## Pull request checklist

Before opening a PR:

- [ ] `npm test` passes with no failures
- [ ] `npm start` runs without console errors
- [ ] No hardcoded platform credentials or tokens
- [ ] New adapter: includes a corresponding mock instance
- [ ] New adapter: `.env.example` updated with required vars
- [ ] New feature: includes at least one test
- [ ] No modifications to existing audit log entries (append-only)
- [ ] PR description explains *what* changed and *why*

---

## Code style

- **ES modules** (`import`/`export`) everywhere — no CommonJS `require()`
- **Functional React components** only — no class components
- **Named exports** for components and utilities; `default export` only for module-level entry points (`OptInModule`, `BookingModule`, etc.)
- **`async/await`** over `.then()` chains
- No `console.log` in production code — use `appendLog()` from `src/lib/auditLog.js` instead
- CSS lives in `App.css` (shared) — no CSS modules, no styled-components, no Tailwind

---

## Questions?

Open a GitHub Discussion or file an issue tagged `question`. We aim to respond within 48 hours.
