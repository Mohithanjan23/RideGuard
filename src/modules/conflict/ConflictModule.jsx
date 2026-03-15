/**
 * Module 3 — Conflict Detection & User Prompt
 *
 * Shown when overlap(s) are detected. Presents full context:
 * - Visual timeline showing where rides overlap
 * - Driver names, routes, timing
 * - Explicit Cancel vs Proceed+Notify decision
 *
 * No automatic action is taken. The user decides.
 */

import React from 'react';
import useRideGuardStore from '../../store/useRideGuardStore';
import { OverlapTimeline, RideRow } from '../../components';

export default function ConflictModule({ onProceed, onCancel }) {
  const { conflicts, pendingBooking, userDecision, setUserDecision } = useRideGuardStore();

  if (!conflicts.length || !pendingBooking) return null;

  const highSeverityCount = conflicts.filter(c => c.severity === 'high').length;

  const handleProceed = () => {
    setUserDecision('proceed');
    onProceed();
  };

  const handleCancel = () => {
    setUserDecision('cancel');
    onCancel();
  };

  return (
    <div className="module-card">
      <div className="conflict-banner">
        <div className="conflict-title">
          {conflicts.length} overlap{conflicts.length !== 1 ? 's' : ''} detected
          {highSeverityCount > 0 && (
            <span className="severity-badge high"> · {highSeverityCount} high severity</span>
          )}
        </div>
        <div className="conflict-body">
          Your new {capitalize(pendingBooking.platform)} booking overlaps with{' '}
          {conflicts.length} existing ride{conflicts.length !== 1 ? 's' : ''}.
          Review the details below before deciding.
        </div>
      </div>

      <div className="module-header">
        <h2 className="module-title">Your decision</h2>
        <p className="module-sub">No action is taken without your confirmation.</p>
      </div>

      <div className="section-label">Timing overlap</div>
      <OverlapTimeline
        activeRides={conflicts.map(c => c.conflictingRide)}
        proposed={pendingBooking}
      />

      <div className="section-label" style={{ marginTop: '1.25rem' }}>Conflicting rides</div>
      {conflicts.map(conflict => (
        <div key={conflict.conflictingRide.id}>
          <RideRow
            ride={conflict.conflictingRide}
            badge={
              <span className={`severity-pill ${conflict.severity}`}>
                {conflict.overlapMinutes} min overlap · {conflict.severity}
              </span>
            }
          />
        </div>
      ))}

      {userDecision === null && (
        <div className="decision-section">
          <div className="decision-info">
            If you proceed, all affected drivers will receive an informational
            notice. No ride will be cancelled. You remain responsible for
            managing the situation with each platform.
          </div>
          <div className="btn-row">
            <button className="btn danger" onClick={handleCancel}>
              Cancel new booking
            </button>
            <button className="btn success" onClick={handleProceed}>
              Proceed &amp; notify drivers →
            </button>
          </div>
        </div>
      )}

      {userDecision === 'cancel' && (
        <div className="decision-result cancel fade-in">
          New booking cancelled. No driver notifications sent.
        </div>
      )}
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
