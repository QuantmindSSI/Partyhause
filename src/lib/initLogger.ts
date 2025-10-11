// Lightweight fallback logger: captures recent logs to window.__appLogs and optionally persists to localStorage.
// This helps when console output is cleared or suppressed in some environments.
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const MAX_ENTRIES = 200;

function installLogger() {
  if (typeof window === 'undefined') return;
  // @ts-ignore
  if ((window as any).__appLoggerInstalled) return;

  // Create circular-safe serializer
  const safeSerialize = (args: any[]) => {
    try {
      return args.map((a) => {
        if (a instanceof Error) return { message: a.message, stack: a.stack };
        if (typeof a === 'object') return JSON.parse(JSON.stringify(a));
        return a;
      });
    } catch (e) {
      return args.map((a) => String(a));
    }
  };

  const storeLog = (level: LogLevel, args: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.__appLogs = w.__appLogs || [];
    w.__appLogs.push({ ts: Date.now(), level, args: safeSerialize(args) });
    if (w.__appLogs.length > MAX_ENTRIES) w.__appLogs.splice(0, w.__appLogs.length - MAX_ENTRIES);
    try {
      // keep a small persistent cache so it survives refreshes in some scenarios
      localStorage.setItem('__appLogs', JSON.stringify(w.__appLogs));
    } catch (e) {
      // ignore storage issues
    }
  };

  const methods: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
  methods.forEach((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orig = (console as any)[m]?.bind(console) || ((...a: any[]) => {});
    (console as any)[m] = (...args: any[]) => {
      try { storeLog(m, args); } catch (e) { /* ignore */ }
      try { orig(...args); } catch (e) { /* ignore */ }
    };
  });

  // mark installed
  // @ts-ignore
  (window as any).__appLoggerInstalled = true;
}

export default installLogger;
