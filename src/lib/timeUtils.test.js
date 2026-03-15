/**
 * timeUtils.test.js
 *
 * Unit tests for shared time/date utilities.
 * Run with: npm test src/lib/timeUtils.test.js
 */

import {
  addMinutes,
  diffMinutes,
  rangesOverlap,
  formatTime,
  formatDateTime,
  isToday,
  todayAt,
  toDate,
} from './timeUtils';

const BASE = new Date('2025-03-15T14:00:00Z');
const ISO  = BASE.toISOString();

describe('toDate', () => {
  test('returns Date unchanged', () => {
    expect(toDate(BASE)).toBe(BASE);
  });
  test('parses ISO string', () => {
    expect(toDate(ISO).getTime()).toBe(BASE.getTime());
  });
  test('parses timestamp number', () => {
    expect(toDate(BASE.getTime()).getTime()).toBe(BASE.getTime());
  });
});

describe('addMinutes', () => {
  test('adds positive minutes', () => {
    const result = addMinutes(BASE, 30);
    expect(result.getTime()).toBe(BASE.getTime() + 30 * 60_000);
  });
  test('subtracts with negative minutes', () => {
    const result = addMinutes(BASE, -15);
    expect(result.getTime()).toBe(BASE.getTime() - 15 * 60_000);
  });
  test('accepts ISO string', () => {
    expect(addMinutes(ISO, 10).getTime()).toBe(BASE.getTime() + 10 * 60_000);
  });
});

describe('diffMinutes', () => {
  test('returns positive when b is later', () => {
    expect(diffMinutes(BASE, addMinutes(BASE, 20))).toBe(20);
  });
  test('returns negative when b is earlier', () => {
    expect(diffMinutes(BASE, addMinutes(BASE, -10))).toBe(-10);
  });
  test('returns 0 for same times', () => {
    expect(diffMinutes(BASE, BASE)).toBe(0);
  });
});

describe('rangesOverlap', () => {
  const start = BASE;
  const end   = addMinutes(BASE, 60);

  test('detects overlap when B starts during A', () => {
    expect(rangesOverlap(start, end, addMinutes(BASE, 30), addMinutes(BASE, 90))).toBe(true);
  });
  test('no overlap when B ends before A starts', () => {
    expect(rangesOverlap(start, end, addMinutes(BASE, -60), addMinutes(BASE, -1))).toBe(false);
  });
  test('no overlap when B starts after A ends', () => {
    expect(rangesOverlap(start, end, addMinutes(BASE, 61), addMinutes(BASE, 90))).toBe(false);
  });
  test('boundary: B starts exactly when A ends — no overlap', () => {
    expect(rangesOverlap(start, end, end, addMinutes(BASE, 90))).toBe(false);
  });
  test('B fully inside A is overlap', () => {
    expect(rangesOverlap(start, end, addMinutes(BASE, 10), addMinutes(BASE, 50))).toBe(true);
  });
});

describe('formatTime', () => {
  test('returns a non-empty string', () => {
    expect(typeof formatTime(BASE)).toBe('string');
    expect(formatTime(BASE).length).toBeGreaterThan(3);
  });
  test('accepts ISO string', () => {
    expect(typeof formatTime(ISO)).toBe('string');
  });
});

describe('formatDateTime', () => {
  test('includes both date and time parts separated by ·', () => {
    const result = formatDateTime(BASE);
    expect(result).toContain('·');
  });
});

describe('isToday', () => {
  test('returns true for now', () => {
    expect(isToday(new Date())).toBe(true);
  });
  test('returns false for a past date', () => {
    expect(isToday(new Date('2000-01-01'))).toBe(false);
  });
});

describe('todayAt', () => {
  test('returns a Date', () => {
    expect(todayAt('10:30')).toBeInstanceOf(Date);
  });
  test('applies offset correctly', () => {
    const base   = todayAt('10:00');
    const offset = todayAt('10:00', 30);
    expect(offset.getTime() - base.getTime()).toBe(30 * 60_000);
  });
});
