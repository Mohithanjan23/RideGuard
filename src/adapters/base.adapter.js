/**
 * BaseAdapter — abstract interface for all platform adapters.
 *
 * Every ride-hailing platform adapter must extend this class
 * and implement getActiveRides() and notifyDriver().
 *
 * Adding a new platform:
 *   1. Copy mock.adapter.js
 *   2. Implement the two abstract methods
 *   3. Register in src/adapters/index.js
 *   No other files need to change.
 */
export class BaseAdapter {
  /**
   * @param {string} authToken  - Platform-specific auth token
   * @param {object} config     - Optional platform config overrides
   */
  constructor(authToken, config = {}) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract — extend it, don\'t instantiate it directly.');
    }
    this.authToken = authToken;
    this.config = config;
  }

  /**
   * Unique platform identifier (lowercase, no spaces).
   * @returns {string}
   */
  get platformId() {
    throw new Error(`${this.constructor.name} must implement platformId getter`);
  }

  /**
   * Human-readable platform name shown in UI.
   * @returns {string}
   */
  get displayName() {
    throw new Error(`${this.constructor.name} must implement displayName getter`);
  }

  /**
   * Fetch all currently active or upcoming rides for this user.
   *
   * @returns {Promise<ActiveRide[]>}
   *
   * ActiveRide shape:
   * {
   *   id: string,              // Platform-native ride ID
   *   platform: string,        // Must match platformId
   *   driver: {
   *     id: string,
   *     name: string,
   *     vehicle: string,
   *   },
   *   pickup: {
   *     address: string,
   *     lat: number,
   *     lng: number,
   *     estimatedTime: Date,   // ISO string or Date
   *   },
   *   dropoff: {
   *     address: string,
   *     lat: number,
   *     lng: number,
   *     estimatedTime: Date,
   *   },
   *   status: 'scheduled' | 'en_route' | 'arrived' | 'in_progress',
   *   etaMinutes: number,
   * }
   */
  async getActiveRides() {
    throw new Error(`${this.constructor.name} must implement getActiveRides()`);
  }

  /**
   * Send an informational notification to a driver about a potential overlap.
   * This should NEVER cancel a ride — informational only.
   *
   * @param {string} rideId       - The ride ID on this platform
   * @param {string} message      - Human-readable message for the driver
   * @returns {Promise<NotifyResult>}
   *
   * NotifyResult shape:
   * {
   *   success: boolean,
   *   sentAt: Date,
   *   method: 'push' | 'sms' | 'in-app' | 'mock',
   *   error?: string,
   * }
   */
  async notifyDriver(rideId, message) {
    throw new Error(`${this.constructor.name} must implement notifyDriver()`);
  }

  /**
   * Health check — verify credentials are valid.
   * Override in concrete adapters for real validation.
   * @returns {Promise<boolean>}
   */
  async ping() {
    return true;
  }
}
