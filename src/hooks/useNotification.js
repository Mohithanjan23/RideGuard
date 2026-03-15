/**
 * useNotification — React hook for dispatching driver notifications.
 *
 * Usage:
 *   const { dispatch, notificationState, isDispatching } = useNotification();
 *   await dispatch(); // notifies all drivers in current conflict list
 */

import { useState, useCallback } from 'react';
import useRideGuardStore from '../store/useRideGuardStore';

export function useNotification() {
  const [isDispatching, setIsDispatching] = useState(false);
  const { notifyAffectedDrivers, notificationState } = useRideGuardStore();

  const dispatch = useCallback(async () => {
    setIsDispatching(true);
    try {
      await notifyAffectedDrivers();
    } finally {
      setIsDispatching(false);
    }
  }, [notifyAffectedDrivers]);

  return { dispatch, isDispatching, notificationState };
}
