/**
 * auditLog.js — append-only event log.
 *
 * Every RideGuard action that affects a booking or driver is recorded here.
 * The log is stored in localStorage and is user-exportable.
 *
 * Log entries are immutable once written.
 */

const STORAGE_KEY = 'rideguard:audit_log';

export const LOG_LEVELS = {
  INFO:  'info',
  WARN:  'warn',
  OK:    'ok',
  SEND:  'send',
  ERROR: 'error',
};

/**
 * Append a new log entry.
 * @param {string} level   - One of LOG_LEVELS
 * @param {string} message - Human-readable description
 * @param {object} [meta]  - Optional structured metadata
 * @returns {LogEntry}
 */
export function appendLog(level, message, meta = {}) {
  const entry = {
    id:        generateId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };

  const existing = readLog();
  const updated  = [...existing, entry];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Storage full or unavailable — continue without persisting
    console.warn('[AuditLog] Could not persist to localStorage:', e.message);
  }

  return entry;
}

/**
 * Read all log entries, newest last.
 * @returns {LogEntry[]}
 */
export function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the log (user-initiated only).
 */
export function clearLog() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export the log as a JSON string for download.
 * @returns {string}
 */
export function exportLogJSON() {
  return JSON.stringify(readLog(), null, 2);
}

/**
 * Export the log as CSV.
 * @returns {string}
 */
export function exportLogCSV() {
  const entries = readLog();
  const headers = 'id,timestamp,level,message\n';
  const rows = entries.map(e =>
    `"${e.id}","${e.timestamp}","${e.level}","${e.message.replace(/"/g, '""')}"`
  );
  return headers + rows.join('\n');
}

// ─── Internal ────────────────────────────────────────────────────────────────

function generateId() {
  return 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}
