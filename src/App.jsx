import React, { useState } from 'react';
import OptInModule   from './modules/opt-in/OptInModule';
import BookingModule from './modules/booking/BookingModule';
import ConflictModule from './modules/conflict/ConflictModule';
import NotifyModule  from './modules/notify/NotifyModule';
import { ModuleStepper } from './components/index';
import useRideGuardStore from './store/useRideGuardStore';
import './App.css';

export default function App() {
  const [activeModule, setActiveModule]     = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const { setPendingBooking, resetDecision } = useRideGuardStore();

  const markDone = (idx) =>
    setCompletedModules(prev => prev.includes(idx) ? prev : [...prev, idx]);

  const progress = (completedModules.length / 4) * 100;

  return (
    <div className="app-wrap">
      <header className="app-header">
        <div className="header-top">
          <div className="logo-dot" />
          <h1>RideGuard</h1>
        </div>
        <p>Open-source double-booking prevention · User-controlled · Platform-agnostic</p>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <ModuleStepper
        activeModule={activeModule}
        completedModules={completedModules}
        onSelect={setActiveModule}
      />

      {activeModule === 0 && (
        <OptInModule
          onComplete={() => { markDone(0); setActiveModule(1); }}
        />
      )}

      {activeModule === 1 && (
        <BookingModule
          onConflictFound={(proposed, conflicts) => {
            setPendingBooking(proposed);
            markDone(1);
            setActiveModule(2);
          }}
          onClear={() => {
            markDone(1);
          }}
        />
      )}

      {activeModule === 2 && (
        <ConflictModule
          onProceed={() => { markDone(2); setActiveModule(3); }}
          onCancel={resetDecision}
        />
      )}

      {activeModule === 3 && (
        <NotifyModule />
      )}

      {completedModules.includes(3) && (
        <div className="walkthrough">
          <div className="walkthrough-title">Prototype complete</div>
          <div className="walkthrough-body">
            All four modules ran end-to-end. The audit log captured every action with timestamps.
            For production, wire up real platform adapters in <code>src/adapters/</code> and
            add auth token management.
          </div>
        </div>
      )}
    </div>
  );
}
