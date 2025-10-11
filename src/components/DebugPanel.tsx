import React, { useEffect, useState } from 'react';
import { usePartyStore } from '@/store/usePartyStore';

const isDebugMode = () => {
  try {
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    if (url && url.searchParams.get('debug') === 'true') return true;
    return localStorage.getItem('debugPanel') === 'true';
  } catch (e) {
    return false;
  }
};

export const DebugPanel = () => {
  const [visible, setVisible] = useState(isDebugMode());
  const user = usePartyStore((s) => s.user);
  const currentPage = usePartyStore((s) => s.currentPage);
  const events = usePartyStore((s) => s.events);
  const currentEvent = usePartyStore((s) => s.currentEvent);
  const guests = usePartyStore((s) => s.guests);
  const isLoading = usePartyStore((s) => s.isLoading);

  useEffect(() => {
    // expose dump helper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__dumpPartyStore = () => usePartyStore.getState();
    // expose app logs helper
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__getAppLogs = () => JSON.parse(localStorage.getItem('__appLogs') || 'null') || (window as any).__appLogs || [];
    } catch (e) {
      // ignore
    }
  }, []);

  if (!visible) {
    return (
      <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}>
        <button className="btn" onClick={() => { setVisible(true); localStorage.setItem('debugPanel', 'true'); }}>Show Debug</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, width: 360, maxHeight: '60vh', overflow: 'auto', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 12, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Debug Panel</strong>
        <div>
          <button className="btn" onClick={() => { setVisible(false); localStorage.setItem('debugPanel', 'false'); }}>Hide</button>
        </div>
      </div>
      <div style={{ fontSize: 12 }}>
        <div><strong>user:</strong> {user ? user.email || user.name || user.id : 'null'}</div>
        <div><strong>currentPage:</strong> {String(currentPage)}</div>
        <div><strong>events:</strong> {events?.length ?? 0}</div>
        <div><strong>currentEvent:</strong> {currentEvent?.id ?? 'null'}</div>
        <div><strong>guests:</strong> {guests?.length ?? 0}</div>
        <div><strong>isLoading:</strong> {String(isLoading)}</div>
      </div>
      <pre style={{ fontSize: 11, marginTop: 8, whiteSpace: 'pre-wrap' }}>{JSON.stringify({ user, currentPage, currentEventId: currentEvent?.id, eventsCount: events?.length, guestsCount: guests?.length, isLoading }, null, 2)}</pre>
      <div style={{ marginTop: 8 }}>
        <strong>Recent logs</strong>
        <div style={{ maxHeight: 200, overflow: 'auto', background: 'rgba(255,255,255,0.03)', padding: 8, marginTop: 6, borderRadius: 6 }}>
          <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
            {(() => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const logs = (window as any).__getAppLogs ? (window as any).__getAppLogs() : ((window as any).__appLogs || []);
                const slice = logs.slice(-40);
                return slice.map((l: any) => `[${new Date(l.ts).toLocaleTimeString()}] ${l.level.toUpperCase()} ${JSON.stringify(l.args)}\n`).join('');
              } catch (e) {
                return 'no logs';
              }
            })()}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
