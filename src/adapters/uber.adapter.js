import { BaseAdapter } from './base.adapter';

/**
 * UberAdapter — connects to the Uber Rider API.
 *
 * Status: STUB — not yet implemented.
 * Contributions welcome! See CONTRIBUTING.md for the adapter spec.
 *
 * Uber developer docs: https://developer.uber.com/docs/riders/introduction
 *
 * Required env vars:
 *   REACT_APP_UBER_CLIENT_ID
 *   REACT_APP_UBER_CLIENT_SECRET
 */
export class UberAdapter extends BaseAdapter {
  constructor(authToken) {
    super(authToken);
    this.baseUrl = 'https://api.uber.com/v1.2';
  }

  get platformId() { return 'uber'; }
  get displayName() { return 'Uber'; }

  async getActiveRides() {
    // TODO: implement
    // GET /requests/current  →  current active trip
    // GET /requests          →  upcoming scheduled trips
    //
    // Response should be mapped to the ActiveRide shape defined in BaseAdapter.
    throw new Error('UberAdapter.getActiveRides() not yet implemented. See CONTRIBUTING.md');
  }

  async notifyDriver(rideId, message) {
    // TODO: implement
    // Uber does not expose a direct driver-message API in public tiers.
    // Options:
    //   1. POST /messages  (if available in partner tier)
    //   2. Webhook callback to Uber dispatch
    //   3. In-app notification via Uber's partner notification service
    throw new Error('UberAdapter.notifyDriver() not yet implemented. See CONTRIBUTING.md');
  }

  async ping() {
    const res = await fetch(`${this.baseUrl}/me`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    return res.ok;
  }
}
