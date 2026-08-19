/**
 * WebMCP monitoring core for PartyHause.
 *
 * LEAF MODULE — must not import anything from the app. `src/lib/api-client.ts`
 * imports this module to record API traffic, so any app import here would
 * create a cycle.
 *
 * Captures bounded histories of API calls and runtime errors/warnings so the
 * WebMCP tools in `src/mcp/tools.ts` can report on application health.
 * All buffers are fixed-size ring buffers: memory growth is bounded.
 * Recording paths never log and never throw.
 */

export interface ApiCallRecord {
  /** ISO-8601 timestamp of request completion. */
  timestamp: string;
  method: string;
  /** Path + query only. Headers and bodies are never recorded. */
  path: string;
  /** HTTP status, or null when the request never produced a response. */
  status: number | null;
  ok: boolean;
  durationMs: number;
  /** Fetch attempts used (GETs retry once on transient failures). */
  attempts: number;
  errorMessage: string | null;
}

export interface RuntimeErrorRecord {
  /** ISO-8601 timestamp of capture. */
  timestamp: string;
  level: 'error' | 'warning';
  source: 'window.error' | 'unhandledrejection' | 'console.error' | 'console.warn';
  message: string;
  stack: string | null;
}

const MAX_API_RECORDS = 200;
const MAX_ERROR_RECORDS = 100;
const MAX_MESSAGE_CHARS = 500;
const MAX_STACK_CHARS = 2000;

const apiCalls: ApiCallRecord[] = [];
const runtimeErrors: RuntimeErrorRecord[] = [];
const startedAtMs = Date.now();
let errorCaptureInstalled = false;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/** Convert an arbitrary thrown/logged value into a bounded string. */
function toMessage(value: unknown): string {
  if (value instanceof Error) {
    return truncate(`${value.name}: ${value.message}`, MAX_MESSAGE_CHARS);
  }
  if (typeof value === 'string') {
    return truncate(value, MAX_MESSAGE_CHARS);
  }
  try {
    return truncate(JSON.stringify(value) ?? String(value), MAX_MESSAGE_CHARS);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function toStack(value: unknown): string | null {
  if (value instanceof Error && typeof value.stack === 'string') {
    return truncate(value.stack, MAX_STACK_CHARS);
  }
  return null;
}

/** Record one completed API request. Called by src/lib/api-client.ts. */
export function recordApiCall(record: ApiCallRecord): void {
  apiCalls.push(record);
  if (apiCalls.length > MAX_API_RECORDS) {
    apiCalls.shift();
  }
}

function recordRuntimeError(
  source: RuntimeErrorRecord['source'],
  level: RuntimeErrorRecord['level'],
  message: string,
  stack: string | null,
): void {
  runtimeErrors.push({
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    stack,
  });
  if (runtimeErrors.length > MAX_ERROR_RECORDS) {
    runtimeErrors.shift();
  }
}

/**
 * Install window error / unhandledrejection listeners and wrap
 * console.error / console.warn. Idempotent; original console methods are
 * always invoked first so existing behaviour is unchanged.
 */
export function installGlobalErrorCapture(): void {
  if (errorCaptureInstalled || typeof window === 'undefined') {
    return;
  }
  errorCaptureInstalled = true;

  window.addEventListener('error', (event: ErrorEvent) => {
    const reason = event.error ?? event.message;
    recordRuntimeError('window.error', 'error', toMessage(reason), toStack(event.error));
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    recordRuntimeError('unhandledrejection', 'error', toMessage(event.reason), toStack(event.reason));
  });

  // NOTE ON DEVTOOLS ATTRIBUTION: because these wrappers become the new
  // console.error/console.warn, browser devtools show THIS file as the top
  // stack frame for every warning logged after boot (e.g. Vite's "Module
  // 'path' has been externalized" messages appear as "monitor.ts"). The
  // wrapper only observes — the original console method is always invoked
  // first with untouched arguments. Expand the printed stack one frame to
  // see the real call site.
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]): void => {
    originalError(...args);
    try {
      recordRuntimeError('console.error', 'error', args.map(toMessage).join(' '), toStack(args[0]));
    } catch {
      // Recording must never break console output.
    }
  };

  console.warn = (...args: unknown[]): void => {
    originalWarn(...args);
    try {
      recordRuntimeError('console.warn', 'warning', args.map(toMessage).join(' '), toStack(args[0]));
    } catch {
      // Recording must never break console output.
    }
  };
}

/** Most recent API calls, newest first. */
export function getApiActivity(limit: number, errorsOnly: boolean): ApiCallRecord[] {
  const source = errorsOnly ? apiCalls.filter((c) => !c.ok) : apiCalls;
  return source.slice(-limit).reverse();
}

/** Most recent runtime errors/warnings, newest first. */
export function getRuntimeErrors(
  limit: number,
  level: 'all' | 'error' | 'warning',
): RuntimeErrorRecord[] {
  const source = level === 'all' ? runtimeErrors : runtimeErrors.filter((e) => e.level === level);
  return source.slice(-limit).reverse();
}

export interface MonitorStats {
  uptimeMs: number;
  api: {
    recorded: number;
    errorCount: number;
    errorRatePct: number;
    avgDurationMs: number;
    lastCallAt: string | null;
  };
  errors: {
    errorCount: number;
    warningCount: number;
    lastErrorAt: string | null;
  };
}

/** Aggregate view over both buffers. */
export function getMonitorStats(): MonitorStats {
  const apiErrorCount = apiCalls.reduce((n, c) => n + (c.ok ? 0 : 1), 0);
  const totalDuration = apiCalls.reduce((n, c) => n + c.durationMs, 0);
  const errorCount = runtimeErrors.reduce((n, e) => n + (e.level === 'error' ? 1 : 0), 0);
  const lastError = runtimeErrors.length > 0 ? runtimeErrors[runtimeErrors.length - 1] : null;
  const lastCall = apiCalls.length > 0 ? apiCalls[apiCalls.length - 1] : null;

  return {
    uptimeMs: Date.now() - startedAtMs,
    api: {
      recorded: apiCalls.length,
      errorCount: apiErrorCount,
      errorRatePct: apiCalls.length > 0 ? Math.round((apiErrorCount / apiCalls.length) * 100) : 0,
      avgDurationMs: apiCalls.length > 0 ? Math.round(totalDuration / apiCalls.length) : 0,
      lastCallAt: lastCall ? lastCall.timestamp : null,
    },
    errors: {
      errorCount,
      warningCount: runtimeErrors.length - errorCount,
      lastErrorAt: lastError ? lastError.timestamp : null,
    },
  };
}
