/**
 * timeUtils.js — shared time/date helpers used across RideGuard modules.
 *
 * All functions are pure (no side effects) and work with both
 * native Date objects and ISO 8601 strings.
 */

/**
 * Add minutes to a date.
 * @param {Date|string} date
 * @param {number} minutes
 * @returns {Date}
 */
export function addMinutes(date, minutes) {
  return new Date(toDate(date).getTime() + minutes * 60_000);
}

/**
 * Difference between two dates in minutes (positive = b is later).
 * @param {Date|string} a
 * @param {Date|string} b
 * @returns {number}
 */
export function diffMinutes(a, b) {
  return (toDate(b).getTime() - toDate(a).getTime()) / 60_000;
}

/**
 * Check whether two time ranges overlap.
 * @param {Date|string} startA
 * @param {Date|string} endA
 * @param {Date|string} startB
 * @param {Date|string} endB
 * @returns {boolean}
 */
export function rangesOverlap(startA, endA, startB, endB) {
  return toDate(startA) < toDate(endB) && toDate(endA) > toDate(startB);
}

/**
 * Format a date as a short human time string — e.g. "2:45 PM".
 * @param {Date|string} date
 * @returns {string}
 */
export function formatTime(date) {
  return toDate(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date as "Mon, Mar 15 · 2:45 PM".
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = toDate(date);
  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${datePart} · ${formatTime(d)}`;
}

/**
 * Return true if the given date is today.
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d   = toDate(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

/**
 * Build a Date for today at a given HH:MM time string (24h or 12h).
 * @param {string} timeStr  e.g. "14:30" or "02:30"
 * @param {number} [offsetMinutes]  optional forward offset
 * @returns {Date}
 */
export function todayAt(timeStr, offsetMinutes = 0) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + offsetMinutes, 0, 0);
  return d;
}

/**
 * Normalise to Date. Accepts Date | ISO string | timestamp.
 * @param {Date|string|number} val
 * @returns {Date}
 */
export function toDate(val) {
  if (val instanceof Date) return val;
  return new Date(val);
}
