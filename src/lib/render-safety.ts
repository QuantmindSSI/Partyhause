/**
 * Render Safety Utilities
 * Prevents render loops, rate limits state updates, and provides safe hooks
 */

import { useCallback, useEffect, useRef } from 'react';

// Rate limiting for state updates
class StateUpdateLimiter {
  private updateCounts = new Map<string, number>();
  private timeWindows = new Map<string, number>();
  private readonly maxUpdatesPerWindow = 10;
  private readonly windowDuration = 1000; // 1 second

  canUpdate(key: string): boolean {
    const now = Date.now();
    const lastWindow = this.timeWindows.get(key) || 0;
    
    // Reset counter if we're in a new time window
    if (now - lastWindow > this.windowDuration) {
      this.updateCounts.set(key, 0);
      this.timeWindows.set(key, now);
    }
    
    const currentCount = this.updateCounts.get(key) || 0;
    
    if (currentCount >= this.maxUpdatesPerWindow) {
      console.warn(`🚨 RENDER_SAFETY: Rate limit exceeded for ${key}. Blocking update to prevent render loop.`);
      return false;
    }
    
    this.updateCounts.set(key, currentCount + 1);
    return true;
  }
  
  reset(key?: string) {
    if (key) {
      this.updateCounts.delete(key);
      this.timeWindows.delete(key);
    } else {
      this.updateCounts.clear();
      this.timeWindows.clear();
    }
  }
}

export const stateUpdateLimiter = new StateUpdateLimiter();

// Safe state update wrapper
export function safeStateUpdate<T extends (...args: any[]) => void>(
  updateFn: T,
  key: string,
  description?: string
): T {
  return ((...args: Parameters<T>) => {
    if (!stateUpdateLimiter.canUpdate(key)) {
      console.warn(`🚨 RENDER_SAFETY: Blocked ${description || key} update to prevent render loop`);
      return;
    }
    
    console.log(`✅ RENDER_SAFETY: Allowing ${description || key} update`);
    return updateFn(...args);
  }) as T;
}

// Hook to detect excessive re-renders
export function useRenderSafety(componentName: string, maxRenders = 50) {
  const renderCount = useRef(0);
  const lastReset = useRef(Date.now());
  
  renderCount.current++;
  
  // Reset counter every 5 seconds
  const now = Date.now();
  if (now - lastReset.current > 5000) {
    renderCount.current = 1;
    lastReset.current = now;
  }
  
  if (renderCount.current > maxRenders) {
    console.error(`🚨 RENDER_SAFETY: ${componentName} has rendered ${renderCount.current} times in 5 seconds. Possible render loop detected!`);
    
    // In development, throw an error to catch this immediately
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Render loop detected in ${componentName}. Component rendered ${renderCount.current} times in 5 seconds.`);
    }
  }
  
  return renderCount.current;
}

// Stable function reference hook
export function useStableFunction<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef<T>(fn);
  
  // Update the ref if the function changes, but return the same reference
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  return useCallback((...args: Parameters<T>) => {
    return fnRef.current(...args);
  }, []) as T;
}

// Safe useEffect that warns about dependency issues
export function useSafeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
  debugName?: string
) {
  const lastDeps = useRef<React.DependencyList | undefined>();
  const runCount = useRef(0);
  
  // Check for rapid successive runs
  useEffect(() => {
    runCount.current++;
    
    if (runCount.current > 20) {
      console.warn(`🚨 RENDER_SAFETY: useEffect in ${debugName || 'unknown component'} has run ${runCount.current} times. Check dependencies for stability.`);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('Current deps:', deps);
        console.warn('Previous deps:', lastDeps.current);
      }
    }
    
    lastDeps.current = deps;
    
    // Reset counter after 10 seconds
    const timeout = setTimeout(() => {
      runCount.current = 0;
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, deps);
  
  return useEffect(effect, deps);
}

// Debounced state update
export function createDebouncedUpdater<T>(
  updateFn: (value: T) => void,
  delay: number = 100
) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (value: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      updateFn(value);
      timeoutId = null;
    }, delay);
  };
}

// Circuit breaker for state updates
class StateUpdateCircuitBreaker {
  private failures = new Map<string, number>();
  private lastFailureTime = new Map<string, number>();
  private readonly maxFailures = 5;
  private readonly recoveryTime = 30000; // 30 seconds
  
  canExecute(key: string): boolean {
    const failures = this.failures.get(key) || 0;
    const lastFailure = this.lastFailureTime.get(key) || 0;
    const now = Date.now();
    
    // Reset if recovery time has passed
    if (now - lastFailure > this.recoveryTime) {
      this.failures.set(key, 0);
      return true;
    }
    
    if (failures >= this.maxFailures) {
      console.warn(`🚨 RENDER_SAFETY: Circuit breaker OPEN for ${key}. Too many failures, blocking updates.`);
      return false;
    }
    
    return true;
  }
  
  recordSuccess(key: string) {
    this.failures.set(key, 0);
  }
  
  recordFailure(key: string) {
    const currentFailures = this.failures.get(key) || 0;
    this.failures.set(key, currentFailures + 1);
    this.lastFailureTime.set(key, Date.now());
    
    console.warn(`🚨 RENDER_SAFETY: Recorded failure for ${key}. Failures: ${currentFailures + 1}/${this.maxFailures}`);
  }
}

export const stateUpdateCircuitBreaker = new StateUpdateCircuitBreaker();

// Safe async state update with error handling
export async function safeAsyncStateUpdate<T>(
  asyncFn: () => Promise<T>,
  key: string,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
): Promise<T | null> {
  if (!stateUpdateCircuitBreaker.canExecute(key)) {
    console.warn(`🚨 RENDER_SAFETY: Skipping ${key} - circuit breaker is OPEN`);
    return null;
  }
  
  try {
    const result = await asyncFn();
    stateUpdateCircuitBreaker.recordSuccess(key);
    onSuccess?.(result);
    return result;
  } catch (error) {
    stateUpdateCircuitBreaker.recordFailure(key);
    console.error(`🚨 RENDER_SAFETY: Error in ${key}:`, error);
    onError?.(error as Error);
    return null;
  }
}