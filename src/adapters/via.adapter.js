import { BaseAdapter } from './base.adapter';

/**
 * ViaAdapter — connects to the Via Transportation API.
 *
 * Status: STUB — not yet implemented.
 * Contributions welcome! See CONTRIBUTING.md for the adapter spec.
 *
 * Via developer docs: https://developer.ridewithvia.com
 * Via operates primarily in B2B/transit contexts; API access is by request.
 *
 * Required env vars:
 *   REACT_APP_VIA_API_KEY
 */
export class ViaAdapter extends BaseAdapter {
  constructor(authToken) {
    super(authToken);
    this.baseUrl = 'https://api.ridewithvia.com/v1';
  }

  get platformId()  { return 'via'; }
  get displayName() { return 'Via'; }

  async getActiveRides() {
    // TODO: implement
    // Via's rider-facing API endpoints vary by deployment/city.
    // Contact Via developer relations for access to the rider bookings API.
    throw new Error('ViaAdapter.getActiveRides() not yet implemented. See CONTRIBUTING.md');
  }

  async notifyDriver(rideId, message) {
    // TODO: implement
    throw new Error('ViaAdapter.notifyDriver() not yet implemented. See CONTRIBUTING.md');
  }
}
