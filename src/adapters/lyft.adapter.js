import { BaseAdapter } from './base.adapter';

/**
 * LyftAdapter — connects to the Lyft Rides API.
 *
 * Status: STUB — not yet implemented.
 * Contributions welcome! See CONTRIBUTING.md for the adapter spec.
 *
 * Lyft developer docs: https://developer.lyft.com/docs
 *
 * Required env vars:
 *   REACT_APP_LYFT_CLIENT_ID
 *   REACT_APP_LYFT_CLIENT_SECRET
 *
 * Auth flow: Lyft uses OAuth 2.0 with PKCE for mobile/web clients.
 * Exchange the code for a bearer token, then pass it to this adapter.
 */
export class LyftAdapter extends BaseAdapter {
  constructor(authToken) {
    super(authToken);
    this.baseUrl = 'https://api.lyft.com/v1';
  }

  get platformId()   { return 'lyft'; }
  get displayName()  { return 'Lyft'; }

  async getActiveRides() {
    // TODO: implement
    //
    // Lyft endpoints to consider:
    //   GET /rides?state=pending   → upcoming scheduled rides
    //   GET /rides?state=active    → rides currently in progress
    //   GET /rides/{id}            → single ride details
    //
    // Map each ride to the ActiveRide shape (see BaseAdapter for full spec).
    // Key field mappings (Lyft → RideGuard):
    //   ride_id             → id
    //   driver.first_name   → driver.name  (combine first + last)
    //   pickup.time         → pickup.estimatedTime
    //   destination.time    → dropoff.estimatedTime
    //   origin.address      → pickup.address
    //   destination.address → dropoff.address
    //   status              → map 'driveTypePending'→'scheduled', 'accepted'→'en_route', etc.
    throw new Error('LyftAdapter.getActiveRides() not yet implemented. See CONTRIBUTING.md');
  }

  async notifyDriver(rideId, message) {
    // TODO: implement
    //
    // Lyft does not expose a public driver-message endpoint.
    // Recommended approach for production:
    //   1. Register a Lyft sandbox webhook at https://developer.lyft.com
    //   2. Use the sandbox /sandbox/rides/{id}/feedback endpoint to test
    //   3. For production, apply for Lyft Platform Partner access to
    //      get access to driver communication APIs
    throw new Error('LyftAdapter.notifyDriver() not yet implemented. See CONTRIBUTING.md');
  }

  async ping() {
    const res = await fetch(`${this.baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    return res.ok;
  }
}
