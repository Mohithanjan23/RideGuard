# RideGuard 🛡️

> **Open-source double-booking prevention for ride-hailing platforms.**  
> User-controlled. Transparent. Platform-agnostic.

---

## What is RideGuard?

RideGuard is a middleware layer that lets users opt in to cross-platform conflict detection when booking rides. When a new booking is attempted, RideGuard checks all connected platforms for active rides, warns the user about overlaps, and — with explicit user consent — notifies affected drivers.

**No booking is ever cancelled automatically. The user is always in control.**

---

## Core Principles

- **Opt-in only** — zero monitoring unless the user explicitly enables it
- **User-first decisions** — conflicts surface as prompts, never auto-resolved
- **Driver transparency** — drivers are notified only after user confirmation
- **Audit trail** — every action is timestamped and user-accessible
- **Modular adapters** — add new platforms without touching core logic

---

## Architecture

```
rideguard/
├── src/
│   ├── modules/
│   │   ├── opt-in/          # Module 1: enrollment, platform selection, consent
│   │   ├── booking/         # Module 2: new booking detection + active ride scan
│   │   ├── conflict/        # Module 3: overlap detection + user prompt
│   │   └── notify/          # Module 4: driver notification dispatch + logging
│   │
│   ├── adapters/            # Per-platform API adapters (swap freely)
│   │   ├── base.adapter.js  # Abstract interface all adapters must implement
│   │   ├── uber.adapter.js
│   │   ├── lyft.adapter.js
│   │   ├── bolt.adapter.js
│   │   └── mock.adapter.js  # Offline adapter for testing
│   │
│   ├── store/               # Zustand global state
│   │   └── useRideGuardStore.js
│   │
│   ├── hooks/               # Reusable React hooks
│   │   ├── useConflictCheck.js
│   │   └── useNotification.js
│   │
│   ├── lib/
│   │   ├── conflictEngine.js  # Pure overlap detection logic (no React)
│   │   ├── auditLog.js        # Append-only event log
│   │   └── timeUtils.js       # Time window helpers
│   │
│   └── components/
│       ├── PlatformCard.jsx
│       ├── RideRow.jsx
│       ├── ConflictBanner.jsx
│       ├── OverlapTimeline.jsx
│       ├── ToggleSwitch.jsx
│       ├── NotifyLog.jsx
│       └── ModuleStepper.jsx
│
├── public/
│   └── index.html
│
├── CONTRIBUTING.md
└── package.json
```

---

## Modules

### Module 1 — Opt-In Flow
**Files:** `src/modules/opt-in/`

Handles user enrollment. Nothing downstream activates without explicit opt-in. Key flows:
- Master guard toggle (disabled by default)
- Per-platform selection
- Human-readable consent acknowledgment
- Preferences persisted to localStorage

### Module 2 — Booking Check
**Files:** `src/modules/booking/`

Triggered when a new ride booking is attempted (intercepted via platform deep-link or API webhook). Queries all connected platform adapters for rides within a configurable time window.

```js
// Configurable in store
const CHECK_WINDOW_MINUTES = 90; // rides within ±90 min are checked
```

### Module 3 — Conflict Detection + User Prompt
**Files:** `src/modules/conflict/`, `src/lib/conflictEngine.js`

Pure logic layer — no platform-specific code. Takes a list of active rides + a proposed booking and returns overlap results. User is shown:
- Visual timeline of overlapping rides
- Driver names and routes
- Explicit **Cancel** vs **Proceed + Notify** choice

### Module 4 — Driver Notifications
**Files:** `src/modules/notify/`

Fires only after explicit user confirmation. Each platform adapter exposes a `notifyDriver()` method. All dispatches are logged with timestamps.

---

## Platform Adapters

Each adapter implements the `BaseAdapter` interface:

```js
class BaseAdapter {
  async getActiveRides()         // Returns: ActiveRide[]
  async notifyDriver(rideId, message) // Returns: NotifyResult
  get platformId()               // Returns: string
  get displayName()              // Returns: string
}
```

To add a new platform, copy `mock.adapter.js`, implement the two methods, and register it in `src/adapters/index.js`. No other files need to change.

---

## Getting Started

```bash
git clone https://github.com/your-org/rideguard.git
cd rideguard
npm install
npm start
```

The app runs in **mock mode** by default — no real platform credentials needed for development.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the contribution guide.

Good first issues:
- [ ] Add a real Uber adapter (requires Uber developer account)
- [ ] Add a real Lyft adapter
- [ ] Mobile PWA wrapper
- [ ] Push notification support for driver alerts
- [ ] Conflict audit export (CSV/JSON)
- [ ] Internationalization (i18n)

---

## License

MIT — free to use, fork, and build on.
