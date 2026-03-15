/**
 * useRideGuardStore.js — global application state via Zustand.
 *
 * Single source of truth for:
 *  - User preferences (opt-in, platform selection)
 *  - Current active rides (fetched from adapters)
 *  - Conflict detection results
 *  - Notification dispatch state
 *  - Audit log (in-memory mirror of localStorage log)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectConflicts, buildDriverMessage } from '../lib/conflictEngine';
import { appendLog, readLog, clearLog, exportLogJSON, exportLogCSV, LOG_LEVELS } from '../lib/auditLog';
import { getAdapters } from '../adapters';

const useRideGuardStore = create(
  persist(
    (set, get) => ({

      // ── Preferences (persisted) ────────────────────────────────────────────
      isGuardEnabled:      false,
      selectedPlatforms:   ['uber', 'lyft'],
      hasConsented:        false,
      checkWindowMinutes:  90,

      setGuardEnabled:    (v) => set({ isGuardEnabled: v }),
      togglePlatform: (platformId) => set(state => ({
        selectedPlatforms: state.selectedPlatforms.includes(platformId)
          ? state.selectedPlatforms.filter(p => p !== platformId)
          : [...state.selectedPlatforms, platformId],
      })),
      setConsented:       (v) => set({ hasConsented: v }),
      setCheckWindow:     (v) => set({ checkWindowMinutes: v }),

      // ── Active rides (runtime, not persisted) ─────────────────────────────
      activeRides:   [],
      isFetching:    false,
      fetchError:    null,

      fetchActiveRides: async () => {
        const { selectedPlatforms } = get();
        if (!selectedPlatforms.length) return;

        set({ isFetching: true, fetchError: null });
        appendLog(LOG_LEVELS.INFO, `Fetching active rides from: ${selectedPlatforms.join(', ')}`);

        try {
          const adapters = getAdapters(selectedPlatforms);
          const results  = await Promise.allSettled(adapters.map(a => a.getActiveRides()));

          const rides = results.flatMap((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            appendLog(LOG_LEVELS.ERROR, `Failed to fetch from ${selectedPlatforms[i]}: ${r.reason?.message}`);
            return [];
          });

          set({ activeRides: rides, isFetching: false });
          appendLog(LOG_LEVELS.OK, `Fetched ${rides.length} active ride(s)`);
        } catch (err) {
          set({ isFetching: false, fetchError: err.message });
          appendLog(LOG_LEVELS.ERROR, `Ride fetch error: ${err.message}`);
        }
      },

      // ── Conflict detection ─────────────────────────────────────────────────
      pendingBooking:  null,
      conflicts:       [],
      isChecking:      false,

      setPendingBooking: (booking) => set({ pendingBooking: booking, conflicts: [] }),

      runConflictCheck: async (proposed) => {
        const { checkWindowMinutes } = get();

        set({ isChecking: true, pendingBooking: proposed, conflicts: [] });
        appendLog(LOG_LEVELS.INFO, `Conflict check initiated for ${proposed.platform} booking`);

        // Fetch fresh ride data first
        await get().fetchActiveRides();
        const freshRides = get().activeRides;

        const found = detectConflicts({
          activeRides: freshRides,
          proposed,
          windowMinutes: checkWindowMinutes,
        });

        set({ isChecking: false, conflicts: found });

        if (found.length > 0) {
          appendLog(LOG_LEVELS.WARN, `${found.length} conflict(s) detected for new booking`);
          found.forEach(c => {
            appendLog(
              LOG_LEVELS.WARN,
              `Overlap with ${c.conflictingRide.platform} ride ${c.conflictingRide.id} — ${c.overlapMinutes} min overlap (${c.severity})`,
              { rideId: c.conflictingRide.id, overlapType: c.overlapType }
            );
          });
        } else {
          appendLog(LOG_LEVELS.OK, 'No conflicts detected — booking is clear');
        }

        return found;
      },

      // ── User decision ──────────────────────────────────────────────────────
      userDecision:   null,   // 'proceed' | 'cancel' | null

      setUserDecision: (decision) => {
        set({ userDecision: decision });
        appendLog(LOG_LEVELS.INFO, `User decision: ${decision}`);
      },

      resetDecision: () => set({ userDecision: null, conflicts: [], pendingBooking: null }),

      // ── Driver notifications ───────────────────────────────────────────────
      notificationState: {},   // { [rideId]: 'pending' | 'sent' | 'error' }

      notifyAffectedDrivers: async () => {
        const { conflicts, pendingBooking } = get();
        if (!conflicts.length || !pendingBooking) return;

        const message = buildDriverMessage(conflicts, pendingBooking);

        for (const conflict of conflicts) {
          const ride = conflict.conflictingRide;
          set(s => ({
            notificationState: { ...s.notificationState, [ride.id]: 'pending' },
          }));

          appendLog(LOG_LEVELS.SEND, `Notifying driver ${ride.driver.name} (${ride.platform} ride ${ride.id})`);

          try {
            const { getAdapter } = await import('../adapters');
            const adapter = getAdapter(ride.platform);
            const result  = await adapter.notifyDriver(ride.id, message);

            set(s => ({
              notificationState: { ...s.notificationState, [ride.id]: 'sent' },
            }));

            appendLog(LOG_LEVELS.OK, `Driver ${ride.driver.name} notified via ${result.method} at ${result.sentAt}`);
          } catch (err) {
            set(s => ({
              notificationState: { ...s.notificationState, [ride.id]: 'error' },
            }));
            appendLog(LOG_LEVELS.ERROR, `Failed to notify ${ride.driver.name}: ${err.message}`);
          }
        }
      },

      // ── Audit log ─────────────────────────────────────────────────────────
      auditLog: [],

      refreshAuditLog: () => set({ auditLog: readLog() }),
      clearAuditLog:   () => { clearLog(); set({ auditLog: [] }); },
      exportLogJSON,
      exportLogCSV,

    }),

    {
      name: 'rideguard-prefs',
      // Only persist user preferences, not runtime state
      partialize: (state) => ({
        isGuardEnabled:     state.isGuardEnabled,
        selectedPlatforms:  state.selectedPlatforms,
        hasConsented:       state.hasConsented,
        checkWindowMinutes: state.checkWindowMinutes,
      }),
    }
  )
);

export default useRideGuardStore;
