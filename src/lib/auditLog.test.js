/**
 * auditLog.test.js
 *
 * Unit tests for the append-only audit log.
 * Run with: npm test src/lib/auditLog.test.js
 */

import {
  appendLog,
  readLog,
  clearLog,
  exportLogJSON,
  exportLogCSV,
  LOG_LEVELS,
} from './auditLog';

// Mock localStorage for the test environment
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('appendLog', () => {
  test('returns a log entry with expected fields', () => {
    const entry = appendLog(LOG_LEVELS.INFO, 'Test message');
    expect(entry).toMatchObject({
      level:   'info',
      message: 'Test message',
    });
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
  });

  test('persists to localStorage', () => {
    appendLog(LOG_LEVELS.INFO, 'Persisted message');
    const stored = JSON.parse(localStorage.getItem('rideguard:audit_log'));
    expect(stored).toHaveLength(1);
    expect(stored[0].message).toBe('Persisted message');
  });

  test('appends — does not overwrite existing entries', () => {
    appendLog(LOG_LEVELS.INFO, 'First');
    appendLog(LOG_LEVELS.WARN, 'Second');
    appendLog(LOG_LEVELS.OK,   'Third');
    expect(readLog()).toHaveLength(3);
  });

  test('stores optional meta', () => {
    const entry = appendLog(LOG_LEVELS.INFO, 'With meta', { rideId: 'R42' });
    expect(entry.meta).toEqual({ rideId: 'R42' });
  });
});

describe('readLog', () => {
  test('returns empty array when log is empty', () => {
    expect(readLog()).toEqual([]);
  });

  test('returns all entries in insertion order', () => {
    appendLog(LOG_LEVELS.INFO, 'A');
    appendLog(LOG_LEVELS.WARN, 'B');
    const log = readLog();
    expect(log[0].message).toBe('A');
    expect(log[1].message).toBe('B');
  });

  test('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('rideguard:audit_log', 'NOT_JSON');
    expect(readLog()).toEqual([]);
  });
});

describe('clearLog', () => {
  test('removes all entries', () => {
    appendLog(LOG_LEVELS.INFO, 'To be cleared');
    clearLog();
    expect(readLog()).toHaveLength(0);
  });

  test('is idempotent on empty log', () => {
    expect(() => clearLog()).not.toThrow();
  });
});

describe('exportLogJSON', () => {
  test('returns valid JSON string', () => {
    appendLog(LOG_LEVELS.OK, 'Export test');
    const json = exportLogJSON();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].message).toBe('Export test');
  });
});

describe('exportLogCSV', () => {
  test('starts with header row', () => {
    const csv = exportLogCSV();
    expect(csv.startsWith('id,timestamp,level,message')).toBe(true);
  });

  test('includes one data row per entry', () => {
    appendLog(LOG_LEVELS.INFO,  'Row one');
    appendLog(LOG_LEVELS.WARN, 'Row two');
    const lines = exportLogCSV().trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  test('escapes double quotes in messages', () => {
    appendLog(LOG_LEVELS.INFO, 'She said "hello"');
    const csv = exportLogCSV();
    expect(csv).toContain('""hello""');
  });
});

describe('LOG_LEVELS', () => {
  test('exposes expected level constants', () => {
    expect(LOG_LEVELS.INFO).toBe('info');
    expect(LOG_LEVELS.WARN).toBe('warn');
    expect(LOG_LEVELS.OK).toBe('ok');
    expect(LOG_LEVELS.SEND).toBe('send');
    expect(LOG_LEVELS.ERROR).toBe('error');
  });
});
