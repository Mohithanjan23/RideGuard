import { BaseAdapter } from './base.adapter';

/**
 * MockAdapter — offline adapter for development and testing.
 *
 * Returns deterministic fake data. Simulates network latency.
 * Safe to use without any real platform credentials.
 *
 * Set REACT_APP_USE_MOCK=true (default in dev) to use this adapter
 * for all platforms automatically.
 */
export class MockAdapter extends BaseAdapter {
  constructor(platformId, displayName, mockRides = []) {
    super('mock-token');
    this._platformId = platformId;
    this._displayName = displayName;
    this._mockRides = mockRides;
    this._notifyLog = [];
  }

  get platformId() { return this._platformId; }
  get displayName() { return this._displayName; }

  async getActiveRides() {
    // Simulate network latency
    await delay(300 + Math.random() * 400);
    return this._mockRides.map(r => ({ ...r, platform: this._platformId }));
  }

  async notifyDriver(rideId, message) {
    await delay(200 + Math.random() * 300);
    const result = {
      success: true,
      sentAt: new Date().toISOString(),
      method: 'mock',
      rideId,
      message,
    };
    this._notifyLog.push(result);
    console.log(`[MockAdapter:${this._platformId}] notifyDriver(${rideId}):`, message);
    return result;
  }

  /** Returns all notifications sent so far (for testing/audit) */
  getNotifyLog() {
    return [...this._notifyLog];
  }
}

// ─── Pre-built mock instances ────────────────────────────────────────────────

const now = new Date();
const addMin = (d, m) => new Date(d.getTime() + m * 60000);

export const mockUberAdapter = new MockAdapter('uber', 'Uber', [
  {
    id: 'UBER-R001',
    driver: { id: 'D1', name: 'Marcus T.', vehicle: 'Toyota Camry · Silver' },
    pickup: {
      address: 'Downtown Hub, 4th & Main',
      lat: 37.7749, lng: -122.4194,
      estimatedTime: addMin(now, 12).toISOString(),
    },
    dropoff: {
      address: 'Airport Terminal 3',
      lat: 37.6213, lng: -122.3790,
      estimatedTime: addMin(now, 49).toISOString(),
    },
    status: 'en_route',
    etaMinutes: 12,
  },
]);

export const mockLyftAdapter = new MockAdapter('lyft', 'Lyft', [
  {
    id: 'LYFT-R002',
    driver: { id: 'D2', name: 'Sarah K.', vehicle: 'Honda Accord · White' },
    pickup: {
      address: 'Coffee District, Brew St',
      lat: 37.7858, lng: -122.4065,
      estimatedTime: addMin(now, 8).toISOString(),
    },
    dropoff: {
      address: 'University Campus, Gate B',
      lat: 37.8044, lng: -122.2712,
      estimatedTime: addMin(now, 33).toISOString(),
    },
    status: 'scheduled',
    etaMinutes: 8,
  },
]);

export const mockBoltAdapter = new MockAdapter('bolt', 'Bolt', []);
export const mockViaAdapter  = new MockAdapter('via',  'Via',  []);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
