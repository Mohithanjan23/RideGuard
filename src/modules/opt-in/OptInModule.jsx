/**
 * Module 1 — Opt-In Flow
 *
 * Handles user enrollment: master toggle, platform selection, consent.
 * Nothing downstream activates unless isGuardEnabled && hasConsented.
 */

import React from 'react';
import useRideGuardStore from '../../store/useRideGuardStore';
import { PLATFORM_REGISTRY } from '../../adapters';
import { ToggleSwitch, PlatformCard } from '../../components';

export default function OptInModule({ onComplete }) {
  const {
    isGuardEnabled, setGuardEnabled,
    selectedPlatforms, togglePlatform,
    hasConsented, setConsented,
  } = useRideGuardStore();

  const canSave = isGuardEnabled && hasConsented && selectedPlatforms.length > 0;

  return (
    <div className="module-card">
      <div className="module-header">
        <h2 className="module-title">Guard status</h2>
        <p className="module-sub">Enable cross-platform conflict detection.</p>
      </div>

      <div className="toggle-row">
        <div>
          <div className="toggle-label">Enable double-booking guard</div>
          <div className="toggle-desc">
            {isGuardEnabled ? 'Active — monitoring your rides' : 'Inactive — no checks running'}
          </div>
        </div>
        <ToggleSwitch
          checked={isGuardEnabled}
          onChange={setGuardEnabled}
          label="Enable guard"
        />
      </div>

      {isGuardEnabled && (
        <div className="fade-in">
          <div className="section-label" style={{ marginTop: '1.25rem' }}>
            Connected platforms
          </div>
          <p className="hint-text">Select which platforms to monitor for conflicts.</p>

          <div className="platform-grid">
            {PLATFORM_REGISTRY.map(platform => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                selected={selectedPlatforms.includes(platform.id)}
                onToggle={() => togglePlatform(platform.id)}
              />
            ))}
          </div>

          <div className="section-label" style={{ marginTop: '1.25rem' }}>
            Consent &amp; transparency
          </div>

          <ConsentCheckbox
            checked={hasConsented}
            onChange={setConsented}
          />

          <div className="btn-row">
            <button
              className="btn primary"
              disabled={!canSave}
              onClick={onComplete}
            >
              Save preferences →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConsentCheckbox({ checked, onChange }) {
  return (
    <div
      className={`consent-box ${checked ? 'checked' : ''}`}
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => e.key === ' ' && onChange(!checked)}
    >
      <div className={`consent-check-icon ${checked ? 'checked' : ''}`}>
        {checked && '✓'}
      </div>
      <div className="consent-text">
        I understand that when a conflict is detected, my connected drivers will be
        notified of potential overlapping bookings. <strong>No booking is cancelled
        without my explicit approval.</strong> All actions are logged and accessible
        in my audit trail.
      </div>
    </div>
  );
}
