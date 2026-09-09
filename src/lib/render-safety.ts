import { useRef } from 'react';

/**
 * Detect a likely render loop during development.
 *
 * The counter resets after five seconds. Production records the count without
 * throwing so diagnostics never become a customer-visible failure.
 */
export function useRenderSafety(componentName: string, maxRenders = 50): number {
  const renderCount = useRef(0);
  const lastReset = useRef(Date.now());

  renderCount.current += 1;
  const now = Date.now();
  if (now - lastReset.current > 5_000) {
    renderCount.current = 1;
    lastReset.current = now;
  }

  if (renderCount.current > maxRenders && process.env.NODE_ENV === 'development') {
    throw new Error(
      `Render loop detected in ${componentName}: ${renderCount.current} renders in five seconds.`,
    );
  }

  return renderCount.current;
}
