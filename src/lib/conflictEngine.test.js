/**
 * conflictEngine.test.js
 *
 * Unit tests for the pure conflict detection logic.
 * Run with: npm test src/lib/conflictEngine.test.js
 */

import {
  detectConflicts,
  hasConflict,
  buildDriverMessage,
  DEFAULT_WINDOW_MINUTES,
} from './conflictEngine';

// ─── Test helpers ─────────────────────────────────────────────────────────────

const now = new Date('2025-03-15T14:00:00Z');
const mins = (n) => new Date(now.getTime() + n * 60_000);

/** Build a minimal ActiveRide at a given start/end offset (minutes from now). */
function makeRide(id, platform, startOffset, endOffset) {
  return {
    id,
    platform,
    driver: { id: `D-${id}`, name: `Driver ${id}`, vehicle: 'Toyota Camry' },
    pickup:  { address: 'Origin',      lat: 0, lng: 0, estimatedTime: mins(startOffset).toISOString() },
    dropoff: { address: 'Destination', lat: 1, lng: 1, estimatedTime: mins(endOffset).toISOString()   },
    status: 'scheduled',
    etaMinutes: Math.max(0, startOffset),
  };
}

/** Build a minimal ProposedBooking at a given start/end offset. */
function makeProposed(platform, startOffset, endOffset) {
  return {
    platform,
    from: 'Mall',
    to:   'Station',
    pickupTime:  mins(startOffset).toISOString(),
    dropoffTime: mins(endOffset).toISOString(),
  };
}

// ─── detectConflicts ─────────────────────────────────────────────────────────

describe('detectConflicts', () => {
  test('returns empty array when no active rides', () => {
    const result = detectConflicts({
      activeRides: [],
      proposed: makeProposed('bolt', 30, 60),
    });
    expect(result).toEqual([]);
  });

  test('returns empty array when proposed has no pickupTime', () => {
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed: { platform: 'bolt', from: 'A', to: 'B' },
    });
    expect(result).toEqual([]);
  });

  test('detects a direct overlap', () => {
    // Uber ride: +20 to +50 min
    // New Bolt:  +30 to +60 min → overlap +30..+50 = 20 min
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result).toHaveLength(1);
    expect(result[0].conflictingRide.id).toBe('R1');
    expect(result[0].overlapMinutes).toBe(20);
    expect(result[0].severity).toBe('high');
  });

  test('detects multiple overlaps and sorts by overlap descending', () => {
    const rides = [
      makeRide('R1', 'uber', 20, 50),   // overlap: 20 min
      makeRide('R2', 'lyft', 25, 45),   // overlap: 15 min
    ];
    const result = detectConflicts({
      activeRides: rides,
      proposed:    makeProposed('bolt', 30, 60),
    });
    expect(result).toHaveLength(2);
    expect(result[0].overlapMinutes).toBeGreaterThanOrEqual(result[1].overlapMinutes);
  });

  test('does not flag rides that end before proposed starts', () => {
    // Uber finishes at +20, proposed starts at +30 — no overlap
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 0, 20)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result).toHaveLength(0);
  });

  test('does not flag rides that start after proposed ends', () => {
    // Uber starts at +70, proposed ends at +60 — no overlap
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 70, 100)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result).toHaveLength(0);
  });

  test('flags adjacent rides that touch exactly at one point as no overlap', () => {
    // Uber ends at +30, proposed starts at +30 — boundary, no actual overlap
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 10, 30)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result).toHaveLength(0);
  });

  test('uses windowMinutes when proposed has no dropoffTime', () => {
    const proposed = {
      platform: 'bolt',
      from: 'A',
      to: 'B',
      pickupTime: mins(30).toISOString(),
      // no dropoffTime — engine should use windowMinutes (default 90)
    };
    // Ride at +80 to +100: within the 90-min window from +30 = +30..+120
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 80, 100)],
      proposed,
      windowMinutes: DEFAULT_WINDOW_MINUTES,
    });
    expect(result).toHaveLength(1);
  });

  test('respects custom windowMinutes override', () => {
    const proposed = {
      platform: 'bolt',
      from: 'A', to: 'B',
      pickupTime: mins(30).toISOString(),
    };
    // Ride at +80..+100. With window=30 (+30..+60) there's no overlap.
    const noOverlap = detectConflicts({ activeRides: [makeRide('R1', 'uber', 80, 100)], proposed, windowMinutes: 30 });
    expect(noOverlap).toHaveLength(0);

    // With window=90 (+30..+120) there IS overlap.
    const withOverlap = detectConflicts({ activeRides: [makeRide('R1', 'uber', 80, 100)], proposed, windowMinutes: 90 });
    expect(withOverlap).toHaveLength(1);
  });
});

// ─── overlapType classification ───────────────────────────────────────────────

describe('detectConflicts — overlapType', () => {
  test('classifies "full" when proposed contains active ride entirely', () => {
    // proposed: +10..+80, active: +20..+60 → proposed contains active
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 60)],
      proposed:     makeProposed('bolt', 10, 80),
    });
    expect(result[0].overlapType).toBe('full');
  });

  test('classifies "contained" when active ride contains proposed entirely', () => {
    // active: +10..+80, proposed: +20..+60 → proposed contained in active
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 10, 80)],
      proposed:     makeProposed('bolt', 20, 60),
    });
    expect(result[0].overlapType).toBe('contained');
  });

  test('classifies "partial_start" when proposed overlaps start of active', () => {
    // proposed: +10..+40, active: +30..+70 → proposed overlaps start of active
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 30, 70)],
      proposed:     makeProposed('bolt', 10, 40),
    });
    expect(result[0].overlapType).toBe('partial_start');
  });
});

// ─── severity classification ──────────────────────────────────────────────────

describe('detectConflicts — severity', () => {
  test('high severity for overlap >= 20 min', () => {
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result[0].severity).toBe('high');
  });

  test('medium severity for overlap 8–19 min', () => {
    // overlap: +30..+38 = 8 min
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 38)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result[0].severity).toBe('medium');
  });

  test('low severity for overlap < 8 min', () => {
    // overlap: +30..+34 = 4 min
    const result = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 34)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    expect(result[0].severity).toBe('low');
  });
});

// ─── hasConflict ─────────────────────────────────────────────────────────────

describe('hasConflict', () => {
  test('returns true when conflict exists', () => {
    expect(hasConflict(
      [makeRide('R1', 'uber', 20, 50)],
      makeProposed('bolt', 30, 60)
    )).toBe(true);
  });

  test('returns false when no conflict', () => {
    expect(hasConflict(
      [makeRide('R1', 'uber', 0, 20)],
      makeProposed('bolt', 30, 60)
    )).toBe(false);
  });

  test('returns false for empty ride list', () => {
    expect(hasConflict([], makeProposed('bolt', 30, 60))).toBe(false);
  });
});

// ─── buildDriverMessage ───────────────────────────────────────────────────────

describe('buildDriverMessage', () => {
  test('returns a non-empty string', () => {
    const conflicts = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    const msg = buildDriverMessage(conflicts, makeProposed('bolt', 30, 60));
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(50);
  });

  test('includes the platform name', () => {
    const conflicts = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    const msg = buildDriverMessage(conflicts, makeProposed('bolt', 30, 60));
    expect(msg.toLowerCase()).toContain('bolt');
  });

  test('includes the RideGuard notice marker', () => {
    const conflicts = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    const msg = buildDriverMessage(conflicts, makeProposed('bolt', 30, 60));
    expect(msg).toContain('[RideGuard Notice]');
  });

  test('assures driver no action is needed', () => {
    const conflicts = detectConflicts({
      activeRides: [makeRide('R1', 'uber', 20, 50)],
      proposed:     makeProposed('bolt', 30, 60),
    });
    const msg = buildDriverMessage(conflicts, makeProposed('bolt', 30, 60));
    expect(msg.toLowerCase()).toMatch(/no action|proceed/);
  });
});
