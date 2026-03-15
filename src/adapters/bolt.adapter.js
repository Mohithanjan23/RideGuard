import { BaseAdapter } from './base.adapter';

/**
 * BoltAdapter — connects to the Bolt (formerly Taxify) API.
 *
 * Status: STUB — not yet implemented.
 * Contributions welcome! See CONTRIBUTING.md for the adapter spec.
 *
 * Bolt developer / partner docs: https://developers.bolt.eu
 * Note: Bolt's public API is primarily partner/fleet-facing.
 * Rider API access requires a partnership agreement.
 *
 * Required env vars:
 *   REACT_APP_BOLT_API_KEY
 *   REACT_APP_BOLT_CLIENT_ID
 */
export class BoltAdapter extends BaseAdapter {
  constructor(authToken) {
    super(authToken);
    this.baseUrl = 'https://node.bolt.eu/passenger/v2';
  }

  get platformId()  { return 'bolt'; }
  get displayName() { return 'Bolt'; }

  async getActiveRides() {
    // TODO: implement
    //
    // Bolt API endpoints (partner tier):
    //   POST /getActiveOrder   → currently active trip
    //   POST /getOrderHistory  → recent / scheduled trips
    //
    // Headers required:
    //   Authorization: Bearer <token>
    //   Content-Type: application/json
    //   VERSION: 3
    //   DEVICE_ID: <uuid>
    //
    // Field mappings (Bolt → RideGuard):
    //   order.id               → id
    //   driver.name            → driver.name
    //   driver.car.model       → driver.vehicle
    //   order.pickup.address   → pickup.address
    //   order.destination.addr → dropoff.address
    //   order.pickup_time      → pickup.estimatedTime
    //   order.dropoff_time     → dropoff.estimatedTime (estimate if missing)
    throw new Error('BoltAdapter.getActiveRides() not yet implemented. See CONTRIBUTING.md');
  }

  async notifyDriver(rideId, message) {
    // TODO: implement
    // Bolt partner API includes a messaging endpoint for fleet managers.
    // Contact Bolt developer relations for ride-level driver messaging access.
    throw new Error('BoltAdapter.notifyDriver() not yet implemented. See CONTRIBUTING.md');
  }
}
