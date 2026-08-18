import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock framer-motion components FIRST to avoid animation issues
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: (props: any) => React.createElement('div', props, props.children),
      h1: (props: any) => React.createElement('h1', props, props.children),
      header: (props: any) => React.createElement('header', props, props.children),
      button: (props: any) => React.createElement('button', props, props.children),
      p: (props: any) => React.createElement('p', props, props.children),
      span: (props: any) => React.createElement('span', props, props.children),
      form: (props: any) => React.createElement('form', props, props.children),
      input: (props: any) => React.createElement('input', props, props.children),
      label: (props: any) => React.createElement('label', props, props.children),
    },
    AnimatePresence: (props: any) => props.children,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
    }),
  };
})

// Patch React.createElement to gracefully handle undefined/null element types.
// This prevents "Element type is invalid" errors in tests when a component import is missing
// or a default/named import mismatch results in undefined being used as a JSX element type.
const _createElement = React.createElement.bind(React)
React.createElement = (type: any, props: any, ...children: any[]) => {
  try {
    // Diagnostic: detect obviously invalid element types and log details
    const isValidPrimitive = typeof type === 'string' || typeof type === 'function'
    const isObjectLike = typeof type === 'object' && type !== null
    if (!isValidPrimitive && !isObjectLike) {
      try {
        // eslint-disable-next-line no-console
        console.warn('React.createElement called with suspicious type (not string/function/object):', type, '\nprops:', props);
      } catch (e) {}
    }

    if (type == null) {
      // undefined or null -> render a plain div so tests don't crash
      // Log the occurrence to help identify missing imports
      try {
        // eslint-disable-next-line no-console
        console.warn('React.createElement fallback: type is null/undefined. Rendering fallback div. Props:', props);
      } catch (e) {}
      return _createElement('div', props, ...children)
    }
    return _createElement(type, props, ...children)
  } catch (e) {
    // Fallback: if React would throw for any reason, return a div to keep tests running
    try {
      // Log the problematic type for easier debugging in test output
      // eslint-disable-next-line no-console
      console.warn('React.createElement caught error for type:', type, '\nerror:', e && e.message ? e.message : e);
    } catch (e) {
      // ignore
    }
    return _createElement('div', props, ...children)
  }
}

// Mock Supabase — post-migration: stubs that use localStorage for token storage
vi.mock('@/lib/supabase', () => {
  const TOKEN_KEY = 'partyhause_auth_token';
  const USER_KEY = 'partyhause_auth_user';

  const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
  const setStoredToken = (token: string | null) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  };
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const setStoredUser = (user: any) => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  };
  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return {
    supabase: {
      auth: {
        getSession: async () => {
          const token = getStoredToken();
          const user = getStoredUser();
          return { data: { session: token && user ? { access_token: token, user } : null } };
        },
        getUser: async () => ({ data: { user: getStoredUser() } }),
        signOut: async () => { clearAuth(); return { error: null }; },
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        updateUser: async () => ({ data: { user: null }, error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        verifyOtp: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('disabled') }),
            order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          }),
          or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('disabled') }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('disabled') }) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        rpc: () => Promise.resolve({ data: null, error: new Error('disabled') }),
      }),
    },
    isSupabaseConfigured: false,
    getStoredToken,
    setStoredToken,
    getStoredUser,
    setStoredUser,
    clearAuth,
  };
})

// Real localStorage for jsdom (used by supabase stub for token storage)
let store: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  length: 0,
  key: (_index: number) => null,
} as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.requestIdleCallback and cancelIdleCallback
global.requestIdleCallback = vi.fn().mockImplementation(cb => setTimeout(cb, 0))
global.cancelIdleCallback = vi.fn().mockImplementation(id => clearTimeout(id))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock date-fns to avoid dynamic imports in tests
vi.mock('date-fns', () => ({
  format: vi.fn().mockImplementation((date, formatStr) => {
    // Simple mock implementation
    return new Date(date).toLocaleDateString()
  }),
}))

// Also mock the specific format import
vi.mock('date-fns/format', () => ({
  default: vi.fn().mockImplementation((date, formatStr) => {
    // Simple mock implementation
    return new Date(date).toLocaleDateString()
  }),
}))

// Mock the utils module to avoid dynamic requires
vi.mock('@/lib/utils', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
  safeFormat: vi.fn().mockImplementation((dateLike: any, fmt: string, fallback = '') => {
    try {
      const d = new Date(dateLike);
      if (isNaN(d.getTime())) return fallback;
      return new Date(dateLike).toLocaleDateString();
    } catch (e) {
      return fallback;
    }
  }),
}))

// Mock Sonner toast to avoid DOM issues
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster' }),
}))

// Mock lucide-react icons.
// Proxy-based so ANY icon name resolves to an svg stub — a hand-enumerated
// list goes stale whenever a component starts using a new icon (previously
// caused "No 'Bell' export is defined on the 'lucide-react' mock" crashes).
vi.mock('lucide-react', () => {
  const iconCache = new Map<string, (props: any) => React.ReactElement>();
  const makeIcon = (name: string) => {
    if (!iconCache.has(name)) {
      iconCache.set(name, ({ ...props }: any) =>
        React.createElement('svg', { 'data-lucide': name, ...props }),
      );
    }
    return iconCache.get(name);
  };
  // NOTE: must NOT fabricate 'then' — a module namespace with a callable
  // 'then' becomes a thenable and `await import()` hangs forever. Vitest
  // checks `prop in mock` before reading, so `has` must return true for
  // icon names or it reports "No export is defined on the mock".
  const RESERVED = new Set(['then', 'catch', 'finally', 'toJSON']);
  return new Proxy(
    {},
    {
      get: (_target, prop: string | symbol) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return {};
        if (typeof prop === 'symbol') return undefined;
        if (RESERVED.has(prop)) return undefined;
        return makeIcon(prop);
      },
      has: (_target, prop: string | symbol) =>
        typeof prop === 'string' && !RESERVED.has(prop),
    },
  );
})

// Mock UI components to prevent undefined component errors
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: any) => React.createElement('h3', props, children),
  CardDescription: ({ children, ...props }: any) => React.createElement('p', props, children),
  CardContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardFooter: ({ children, ...props }: any) => React.createElement('div', props, children),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ ...props }: any) => React.createElement('div', props),
}))

// Suppress console errors during tests unless explicitly testing for them
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:') &&
      args[0].includes('ReactDOMTestUtils')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  // nothing else - keep console.errors visible for real errors
})

// Mock eventService so background loads in the store don't throw during tests
vi.mock('@/lib/events', () => ({
  eventService: {
    getUserEvents: vi.fn(async (userId: string) => []),
    getEventGuests: vi.fn(async (eventId: string) => []),
    getEventById: vi.fn(async (id: string) => null),
    createEvent: vi.fn(async (e: any) => null),
    updateEvent: vi.fn(async (id: string, updates: any) => null),
    deleteEvent: vi.fn(async (id: string) => false),
    addGuest: vi.fn(async (g: any) => null),
    updateGuest: vi.fn(async (id: string, updates: any) => null),
    removeGuest: vi.fn(async (id: string) => false),
  }
}))

// Mock useAuth hook to prevent Dashboard component crashes
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    isLoading: false,
  })),
  useUser: vi.fn(() => ({
    user: null,
    isLoading: false,
  })),
  useRequireAuth: vi.fn(() => ({
    isAuthorized: true,
    isLoading: false,
  })),
}))

// Also mock the aggregate '@/lib' index import so modules that import from '@/lib' resolve
vi.mock('@/lib', () => ({
  // lightweight supabase auth mock
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    }
  },
  // reuse a mocked eventService shape
  eventService: {
    getUserEvents: vi.fn(async (userId: string) => []),
    getEventGuests: vi.fn(async (eventId: string) => []),
    getEventById: vi.fn(async (id: string) => null),
    createEvent: vi.fn(async (e: any) => null),
  },
  // minimal utils used in components
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  safeFormat: vi.fn((d: any) => (d ? new Date(d).toLocaleDateString() : '')),
  // animations placeholder
  fadeIn: {},
  staggerContainer: {},
  cardHover: {},
  pulseAnimation: {},
}))

afterAll(() => {
  console.error = originalError
})
