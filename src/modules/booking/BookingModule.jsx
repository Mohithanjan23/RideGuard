/**
 * Module 2 — Booking Check
 *
 * Triggered when a new ride booking is attempted.
 * Scans all connected platform adapters for active rides,
 * then runs conflict detection.
 */

import React, { useState } from 'react';
import useRideGuardStore from '../../store/useRideGuardStore';
import { useConflictCheck } from '../../hooks/useConflictCheck';
import { RideRow } from '../../components';
import { PLATFORM_REGISTRY } from '../../adapters';

const DEFAULT_BOOKING = {
  platform: 'bolt',
  from: 'City Mall',
  to: 'Central Station',
  pickupTime: (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toTimeString().slice(0, 5);
  })(),
};

export default function BookingModule({ onConflictFound, onClear }) {
  const { activeRides, isFetching } = useRideGuardStore();
  const { check, isChecking } = useConflictCheck();
  const [booking, setBooking] = useState(DEFAULT_BOOKING);

  const handleCheck = async () => {
    const proposed = {
      ...booking,
      pickupTime: parseTimeToday(booking.pickupTime),
      dropoffTime: parseTimeToday(booking.pickupTime, 45),
    };

    const conflicts = await check(proposed);
    if (conflicts.length > 0) {
      onConflictFound(proposed, conflicts);
    } else {
      onClear();
    }
  };

  const busy = isFetching || isChecking;

  return (
    <div className="module-card">
      <div className="module-header">
        <h2 className="module-title">Active ride scan</h2>
        <p className="module-sub">
          Checking {activeRides.length} active ride{activeRides.length !== 1 ? 's' : ''} across connected platforms.
        </p>
      </div>

      {activeRides.length > 0 && (
        <>
          <div className="section-label">Current active rides</div>
          {activeRides.map(ride => (
            <RideRow key={ride.id} ride={ride} />
          ))}
        </>
      )}

      {activeRides.length === 0 && !isFetching && (
        <div className="empty-state">No active rides found yet — they'll appear after the check.</div>
      )}

      <div className="section-label" style={{ marginTop: '1.5rem' }}>New booking request</div>

      <div className="booking-form">
        <div className="form-field">
          <label className="form-label">Platform</label>
          <select
            className="form-select"
            value={booking.platform}
            onChange={e => setBooking(b => ({ ...b, platform: e.target.value }))}
          >
            {PLATFORM_REGISTRY.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Pickup time</label>
          <input
            type="time"
            className="form-input"
            value={booking.pickupTime}
            onChange={e => setBooking(b => ({ ...b, pickupTime: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label className="form-label">From</label>
          <input
            className="form-input"
            value={booking.from}
            onChange={e => setBooking(b => ({ ...b, from: e.target.value }))}
            placeholder="Pickup address"
          />
        </div>

        <div className="form-field">
          <label className="form-label">To</label>
          <input
            className="form-input"
            value={booking.to}
            onChange={e => setBooking(b => ({ ...b, to: e.target.value }))}
            placeholder="Destination"
          />
        </div>
      </div>

      <div className="btn-row">
        <button
          className="btn primary"
          onClick={handleCheck}
          disabled={busy}
        >
          {busy ? (
            <span className="pulse">
              {isFetching ? 'Fetching rides...' : 'Checking for conflicts...'}
            </span>
          ) : 'Run booking check →'}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseTimeToday(timeStr, offsetMinutes = 0) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + offsetMinutes, 0, 0);
  return d;
}
