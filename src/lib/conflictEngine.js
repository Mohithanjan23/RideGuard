/**
 * conflictEngine.js — pure overlap detection logic.
 *
 * No React. No platform-specific code. No side effects.
 * Input: a list of active rides + a proposed booking.
 * Output: an array of ConflictResult objects.
 *
 * This is the heart of RideGuard. Keep it pure and well-tested.
 */

/**
 * Default time window: rides that overlap within this range are flagged.
 * Override via detectConflicts({ windowMinutes: N }).
 */
export const DEFAULT_WINDOW_MINUTES = 90;

/**
 * Detect overlapping rides for a proposed new booking.
 *
 * @param {object} params
 * @param {ActiveRide[]} params.activeRides     - Existing confirmed rides
 * @param {ProposedBooking} params.proposed     - The new booking being attempted
 * @param {number} [params.windowMinutes]       - Overlap window (default 90)
 *
 * @returns {ConflictResult[]}
 *
 * ProposedBooking shape:
 * {
 *   platform: string,
 *   pickupTime: Date | string,   // when ride starts
 *   dropoffTime: Date | string,  // estimated end (optional — uses windowMinutes if absent)
 *   from: string,
 *   to: string,
 * }
 *
 * ConflictResult shape:
 * {
 *   conflictingRide: ActiveRide,
 *   overlapType: 'full' | 'partial_start' | 'partial_end' | 'contained',
 *   overlapMinutes: number,
 *   severity: 'high' | 'medium' | 'low',
 * }
 */
export function detectConflicts({ activeRides, proposed, windowMinutes = DEFAULT_WINDOW_MINUTES }) {
  if (!activeRides || activeRides.length === 0) return [];
  if (!proposed?.pickupTime) return [];

  const propStart = toDate(proposed.pickupTime);
  const propEnd   = proposed.dropoffTime
    ? toDate(proposed.dropoffTime)
    : addMinutes(propStart, windowMinutes);

  const conflicts = [];

  for (const ride of activeRides) {
    const rideStart = toDate(ride.pickup.estimatedTime);
    const rideEnd   = toDate(ride.dropoff.estimatedTime);

    const overlap = getOverlapMinutes(propStart, propEnd, rideStart, rideEnd);
    if (overlap <= 0) continue;

    conflicts.push({
      conflictingRide: ride,
      overlapType: classifyOverlap(propStart, propEnd, rideStart, rideEnd),
      overlapMinutes: Math.round(overlap),
      severity: classifySeverity(overlap),
    });
  }

  // Sort: highest overlap first
  return conflicts.sort((a, b) => b.overlapMinutes - a.overlapMinutes);
}

/**
 * Quick boolean check — useful for pre-screening before full detection.
 * @param {ActiveRide[]} activeRides
 * @param {ProposedBooking} proposed
 * @returns {boolean}
 */
export function hasConflict(activeRides, proposed) {
  return detectConflicts({ activeRides, proposed }).length > 0;
}

/**
 * Build a human-readable summary of conflicts for driver notification messages.
 * @param {ConflictResult[]} conflicts
 * @param {ProposedBooking} proposed
 * @returns {string}
 */
export function buildDriverMessage(conflicts, proposed) {
  const lines = [
    `[RideGuard Notice] Your passenger may have overlapping ride bookings.`,
    `New booking: ${proposed.platform} ride from ${proposed.from} to ${proposed.to}`,
    `Scheduled pickup: ${formatTime(proposed.pickupTime)}`,
    ``,
    `This is informational only. The passenger has been made aware and confirmed they wish to proceed.`,
    `No action is required from you — please proceed with your trip as normal.`,
  ];
  return lines.join('\n');
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getOverlapMinutes(startA, endA, startB, endB) {
  const overlapStart = Math.max(startA.getTime(), startB.getTime());
  const overlapEnd   = Math.min(endA.getTime(),   endB.getTime());
  if (overlapEnd <= overlapStart) return 0;
  return (overlapEnd - overlapStart) / 60000;
}

function classifyOverlap(startA, endA, startB, endB) {
  const aS = startA.getTime(), aE = endA.getTime();
  const bS = startB.getTime(), bE = endB.getTime();

  if (aS <= bS && aE >= bE) return 'full';           // A contains B
  if (bS <= aS && bE >= aE) return 'contained';      // B contains A
  if (aS < bS && aE > bS)   return 'partial_start';  // A starts before B, overlaps start of B
  return 'partial_end';                               // A starts inside B
}

function classifySeverity(overlapMinutes) {
  if (overlapMinutes >= 20) return 'high';
  if (overlapMinutes >= 8)  return 'medium';
  return 'low';
}

function toDate(d) {
  return d instanceof Date ? d : new Date(d);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatTime(d) {
  return toDate(d).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
