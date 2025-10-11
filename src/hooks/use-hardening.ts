import { useCallback, useEffect, useRef } from 'react';

// Memory leak prevention: Cleanup subscriptions
export const useSubscriptionCleanup = () => {
  const subscriptions = useRef<(() => void)[]>([]);

  const addSubscription = useCallback((cleanup: () => void) => {
    subscriptions.current.push(cleanup);
  }, []);

  useEffect(() => {
    return () => {
      subscriptions.current.forEach(cleanup => cleanup());
      subscriptions.current = [];
    };
  }, []);

  return addSubscription;
};

// Race condition prevention: Request deduplication
export const useRequestDeduplication = () => {
  const activeRequests = useRef<Set<string>>(new Set());

  const deduplicate = useCallback(async <T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> => {
    if (activeRequests.current.has(key)) {
      throw new Error(`Request '${key}' already in progress`);
    }

    activeRequests.current.add(key);
    try {
      return await request();
    } finally {
      activeRequests.current.delete(key);
    }
  }, []);

  return deduplicate;
};

// Component lifecycle safety
export const useComponentLifecycle = () => {
  const isMounted = useRef(true);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = useCallback(<T>(setter: (value: T) => void) => {
    return (value: T) => {
      if (isMounted.current) {
        setter(value);
      }
    };
  }, []);

  const getLifecycleInfo = useCallback(() => ({
    isMounted: isMounted.current,
    mountedAt: mountedAt.current,
    uptime: Date.now() - mountedAt.current,
  }), []);

  return { safeSetState, getLifecycleInfo, isMounted: isMounted.current };
};

// Async operation safety
export const useAsyncOperation = () => {
  const abortController = useRef<AbortController | null>(null);

  const execute = useCallback(async <T>(
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    // Cancel previous operation
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller
    abortController.current = new AbortController();

    try {
      return await operation(abortController.current.signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Operation was cancelled');
      }
      throw error;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { execute, cancel };
};

// Error recovery hook
export const useErrorRecovery = (maxRetries: number = 3) => {
  const retryCount = useRef(0);
  const lastError = useRef<Error | null>(null);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    shouldRetry?: (error: Error) => boolean
  ): Promise<T> => {
    try {
      const result = await operation();
      retryCount.current = 0; // Reset on success
      lastError.current = null;
      return result;
    } catch (error) {
      lastError.current = error as Error;

      const shouldAttemptRetry =
        retryCount.current < maxRetries &&
        (!shouldRetry || shouldRetry(error as Error));

      if (shouldAttemptRetry) {
        retryCount.current++;
        // Exponential backoff
        const delay = Math.pow(2, retryCount.current) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(operation, shouldRetry);
      }

      throw error;
    }
  }, [maxRetries]);

  const reset = useCallback(() => {
    retryCount.current = 0;
    lastError.current = null;
  }, []);

  return {
    executeWithRetry,
    reset,
    retryCount: retryCount.current,
    lastError: lastError.current,
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    if (import.meta.env.DEV && timeSinceLastRender < 16) {
      console.warn(
        `${componentName}: Rapid re-render detected (${renderCount.current} renders, ${timeSinceLastRender}ms apart)`
      );
    }

    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    getPerformanceInfo: () => ({
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
    }),
  };
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const getMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }, []);

  const checkMemoryPressure = useCallback(() => {
    const info = getMemoryInfo();
    if (!info) return false;

    return info.usagePercent > 80; // Consider high memory usage above 80%
  }, [getMemoryInfo]);

  return { getMemoryInfo, checkMemoryPressure };
};
