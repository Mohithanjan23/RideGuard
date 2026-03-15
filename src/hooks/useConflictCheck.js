/**
 * useConflictCheck — React hook for triggering conflict detection.
 *
 * Wraps the store action with local loading state and callbacks.
 *
 * Usage:
 *   const { check, isChecking, conflicts, error } = useConflictCheck();
 *   await check({ platform: 'bolt', pickupTime: new Date(), from: 'Mall', to: 'Station' });
 */

import { useState, useCallback } from 'react';
import useRideGuardStore from '../store/useRideGuardStore';

export function useConflictCheck() {
  const [error, setError] = useState(null);
  const { runConflictCheck, isChecking, conflicts } = useRideGuardStore();

  const check = useCallback(async (proposed) => {
    setError(null);
    try {
      const found = await runConflictCheck(proposed);
      return found;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [runConflictCheck]);

  return { check, isChecking, conflicts, error };
}
