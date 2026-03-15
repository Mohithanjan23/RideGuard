/**
 * Module 4 — Driver Notifications
 *
 * Dispatches informational notices to affected drivers after
 * explicit user confirmation. Logs every action with timestamps.
 */

import React, { useEffect } from 'react';
import useRideGuardStore from '../../store/useRideGuardStore';
import { useNotification } from '../../hooks/useNotification';
import { NotifyLog } from '../../components';

export default function NotifyModule() {
  const { conflicts, notificationState, auditLog, refreshAuditLog, exportLogJSON, exportLogCSV } = useRideGuardStore();
  const { dispatch, isDispatching } = useNotification();

  // Dispatch notifications on mount (user already confirmed in Module 3)
  useEffect(() => {
    dispatch().then(() => refreshAuditLog());
  }, [dispatch, refreshAuditLog]);

  const handleExportJSON = () => {
    downloadFile('rideguard-audit.json', exportLogJSON(), 'application/json');
  };

  const handleExportCSV = () => {
    downloadFile('rideguard-audit.csv', exportLogCSV(), 'text/csv');
  };

  const allSent = conflicts.every(c =>
    notificationState[c.conflictingRide.id] === 'sent'
  );

  return (
    <div className="module-card">
      <div className="module-header">
        <h2 className="module-title">Driver notifications</h2>
        <p className="module-sub">
          {isDispatching
            ? 'Dispatching notices to affected drivers...'
            : allSent
            ? 'All drivers notified. Your audit log is below.'
            : 'Notification dispatch summary.'}
        </p>
      </div>

      <div className="section-label">Notified drivers</div>

      {conflicts.map(conflict => {
        const ride   = conflict.conflictingRide;
        const status = notificationState[ride.id] || 'pending';
        return (
          <DriverNotifyCard key={ride.id} ride={ride} status={status} />
        );
      })}

      <div className="section-label" style={{ marginTop: '1.5rem' }}>Audit log</div>
      <NotifyLog entries={auditLog} />

      {allSent && (
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={handleExportJSON}>
            Export log (JSON)
          </button>
          <button className="btn" onClick={handleExportCSV}>
            Export log (CSV)
          </button>
        </div>
      )}
    </div>
  );
}

function DriverNotifyCard({ ride, status }) {
  const initials = ride.driver.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="driver-notify-card">
      <div className="driver-avatar">{initials}</div>
      <div className="driver-info">
        <div className="driver-name">{ride.driver.name}</div>
        <div className="driver-detail">
          {capitalize(ride.platform)} · {ride.pickup.address} → {ride.dropoff.address}
        </div>
      </div>
      <span className={`status-pill status-${status}`}>
        {status === 'pending' && <span className="pulse">sending...</span>}
        {status === 'sent'    && 'notified'}
        {status === 'error'   && 'failed'}
      </span>
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
