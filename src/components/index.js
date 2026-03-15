// ─── ToggleSwitch.jsx ───────────────────────────────────────────────────────
export function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="toggle" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="slider-pill" />
    </label>
  );
}

// ─── PlatformCard.jsx ───────────────────────────────────────────────────────
export function PlatformCard({ platform, selected, onToggle }) {
  return (
    <div
      className={`platform-card ${selected ? 'selected' : ''}`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => e.key === ' ' && onToggle()}
    >
      <div className="platform-dot" style={{ background: platform.color }} />
      <span className="platform-name">{platform.name}</span>
      {selected && <span className="platform-check">✓</span>}
    </div>
  );
}

// ─── RideRow.jsx ────────────────────────────────────────────────────────────
export function RideRow({ ride, badge }) {
  const pickupTime  = new Date(ride.pickup.estimatedTime);
  const dropoffTime = new Date(ride.dropoff.estimatedTime);

  return (
    <div className="ride-row">
      <div className="ride-platform-badge">{ride.platform.toUpperCase()}</div>
      <div className="ride-meta">
        <div className="ride-route">
          {ride.pickup.address} → {ride.dropoff.address}
        </div>
        <div className="ride-detail">
          {ride.driver.name} · ETA {ride.etaMinutes} min · {ride.driver.vehicle}
        </div>
      </div>
      <div className="ride-time">
        <div>{formatTime(pickupTime)}</div>
        <div>{formatTime(dropoffTime)}</div>
        {badge && <div style={{ marginTop: 4 }}>{badge}</div>}
      </div>
    </div>
  );
}

// ─── OverlapTimeline.jsx ────────────────────────────────────────────────────
export function OverlapTimeline({ activeRides, proposed }) {
  const PLATFORM_COLORS = {
    uber: '#378ADD', lyft: '#FF00BF', bolt: '#34D186', via: '#FF6B35',
  };

  return (
    <div>
      <div className="overlap-legend">
        {activeRides.map(ride => (
          <div key={ride.id} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: PLATFORM_COLORS[ride.platform] || '#888' }}
            />
            {capitalize(ride.platform)} {ride.id}
          </div>
        ))}
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ background: PLATFORM_COLORS[proposed.platform] || '#888' }}
          />
          New {capitalize(proposed.platform)}
        </div>
      </div>
      <div className="overlap-vis" role="img" aria-label="Ride timing overlap visualization">
        <div className="overlap-bar" style={{ width: '12%', background: 'var(--color-background-secondary)' }} />
        {activeRides.map((ride, i) => (
          <div
            key={ride.id}
            className="overlap-bar"
            style={{
              width: `${25 + i * 5}%`,
              background: hexAlpha(PLATFORM_COLORS[ride.platform] || '#888', 0.18),
              color: PLATFORM_COLORS[ride.platform] || '#888',
              fontSize: 10,
            }}
          >
            {capitalize(ride.platform)}
          </div>
        ))}
        <div
          className="overlap-bar"
          style={{
            width: '12%',
            background: hexAlpha(PLATFORM_COLORS[proposed.platform] || '#888', 0.3),
            color: PLATFORM_COLORS[proposed.platform] || '#888',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          NEW
        </div>
        <div className="overlap-bar" style={{ flex: 1, background: 'var(--color-background-secondary)' }} />
      </div>
    </div>
  );
}

// ─── NotifyLog.jsx ──────────────────────────────────────────────────────────
export function NotifyLog({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <div className="notify-log">
        <span style={{ color: 'var(--color-text-tertiary)' }}>
          Waiting for events...
        </span>
      </div>
    );
  }

  return (
    <div className="notify-log">
      {entries.map(entry => (
        <div key={entry.id} className="log-line fade-in">
          <span className="log-ts">{formatTs(entry.timestamp)}</span>
          <span className={`log-tag tag-${entry.level}`}>{entry.level}</span>
          <span className="log-msg">{entry.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ModuleStepper.jsx ──────────────────────────────────────────────────────
export function ModuleStepper({ activeModule, completedModules, onSelect }) {
  const steps = ['Opt-in', 'Check', 'Confirm', 'Notify'];

  return (
    <div className="module-stepper">
      {steps.map((label, i) => (
        <div
          key={i}
          className={[
            'step-tab',
            activeModule === i   ? 'active'    : '',
            completedModules.includes(i) ? 'done' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onSelect(i)}
        >
          <span className="step-num">0{i + 1}</span>
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── ConflictBanner.jsx ─────────────────────────────────────────────────────
export function ConflictBanner({ conflictCount, platformName }) {
  return (
    <div className="conflict-banner">
      <div className="conflict-title">
        Overlap detected — {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
      </div>
      <div className="conflict-body">
        Your new {platformName} booking overlaps with {conflictCount} active{' '}
        ride{conflictCount !== 1 ? 's' : ''}. Review and decide below.
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatTs(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

const Components = {
  ToggleSwitch, PlatformCard, RideRow,
  OverlapTimeline, NotifyLog, ModuleStepper, ConflictBanner,
};

export default Components;
