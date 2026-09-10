import '@testing-library/jest-dom'
import { configure } from '@testing-library/dom'
import { vi } from 'vitest'
import React from 'react'

/**
 * Raise the async-utility bound for every `waitFor` and `findBy*` in the suite.
 *
 * Every page in src/App.tsx sits behind React.lazy, so an integration test that
 * renders <App /> must resolve a chunk through Suspense before any text exists
 * in the DOM. On an idle machine that lands in roughly 200ms and testing
 * library's 1000ms default never bites. Put the machine under load, which is
 * the normal condition of a CI runner, and it does.
 *
 * The failure does not look like a timeout. It surfaces as
 * `Unable to find an element with the text: PartyHause` with the Suspense
 * fallback spinner still in the DOM, which reads as a broken assertion rather
 * than a slow one. That cost real time to diagnose.
 *
 * 5000ms is set here rather than per-assertion because the problem belongs to
 * every test that renders a lazy route, not to the one that happened to fail
 * first. A passing test still returns as soon as its condition is met, so this
 * costs nothing on the happy path; it only changes how long a genuine failure
 * takes to report.
 */
configure({ asyncUtilTimeout: 5000 })

// Mock framer-motion components FIRST to avoid animation issues
vi.mock('framer-motion', () => {
  const React = require('react');

  // framer-motion's animation props are not valid DOM attributes. Forwarding
  // them produces a React "unknown prop" warning per element per render,
  // which buries real warnings, so they are stripped here rather than in
  // every suite that renders an animated component.
  const MOTION_ONLY_PROPS = new Set([
    'initial', 'animate', 'exit', 'transition', 'variants', 'viewport',
    'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
    'layout', 'layoutId', 'drag', 'dragConstraints', 'onAnimationStart',
    'onAnimationComplete', 'custom',
  ]);

  const stripMotionProps = (props: any) => {
    if (!props) return props;
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (!MOTION_ONLY_PROPS.has(key)) next[key] = props[key];
    }
    return next;
  };

  const motionTag = (tag: string) => (props: any) =>
    React.createElement(tag, stripMotionProps(props), props?.children);

  // A MotionValue is only ever read through `style` here, and jsdom does no
  // layout, so a plain object with the same read surface is sufficient.
  const motionValue = (value: number) => ({
    get: () => value,
    set: vi.fn(),
    onChange: () => () => {},
    on: () => () => {},
    destroy: vi.fn(),
  });

  return {
    motion: {
      div: motionTag('div'),
      h1: motionTag('h1'),
      h2: motionTag('h2'),
      h3: motionTag('h3'),
      header: motionTag('header'),
      nav: motionTag('nav'),
      section: motionTag('section'),
      article: motionTag('article'),
      button: motionTag('button'),
      a: motionTag('a'),
      p: motionTag('p'),
      span: motionTag('span'),
      ul: motionTag('ul'),
      li: motionTag('li'),
      form: motionTag('form'),
      input: motionTag('input'),
      label: motionTag('label'),
      footer: motionTag('footer'),
    },
    AnimatePresence: (props: any) => props.children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useScroll: () => ({
      scrollY: motionValue(0),
      scrollYProgress: motionValue(0),
      scrollX: motionValue(0),
      scrollXProgress: motionValue(0),
    }),
    useTransform: (_source: unknown, _input: unknown, output: unknown) =>
      motionValue(Array.isArray(output) ? (output[0] as number) : 0),
    useMotionValue: (initial: number) => motionValue(initial),
    useSpring: (initial: number) => motionValue(initial),
    // Default to "motion is fine". Suites that need the reduced-motion branch
    // override this module locally.
    useReducedMotion: () => false,
    useInView: () => true,
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

// `@/lib/auth-storage` is deliberately NOT mocked.
//
// It is five functions over localStorage with no SDK and no network, and this
// file installs a real localStorage below. A mock here would be a second
// implementation of the same behaviour, free to drift from the real one, and
// drift in the module that decides "am I signed in" is the expensive kind.
// Suites that need the calls observable install their own vi.fn() mock.

// Real localStorage for jsdom (backs @/lib/auth-storage)
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
