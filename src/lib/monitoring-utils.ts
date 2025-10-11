/**
 * Application Health Monitoring Utilities
 * 
 * Core monitoring functionality without React components.
 * For the debug panel component, see src/components/DebugMonitorPanel.tsx
 */

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private maxMetricsPerKey = 100;

  recordMetric(key: string, value: number) {
    const values = this.metrics.get(key) || [];
    values.push(value);
    
    // Keep only recent metrics
    if (values.length > this.maxMetricsPerKey) {
      values.shift();
    }
    
    this.metrics.set(key, values);
  }

  getAverage(key: string): number {
    const values = this.metrics.get(key) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getLatest(key: string): number {
    const values = this.metrics.get(key) || [];
    return values[values.length - 1] || 0;
  }

  getAllMetrics() {
    const result: Record<string, { average: number; latest: number; count: number }> = {};
    
    for (const [key, values] of this.metrics.entries()) {
      result[key] = {
        average: this.getAverage(key),
        latest: this.getLatest(key),
        count: values.length
      };
    }
    
    return result;
  }

  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// State change monitoring
let stateChangeCount = 0;
let lastStateChange = Date.now();

export function trackStateChange(actionName: string) {
  const now = Date.now();
  const timeSinceLastChange = now - lastStateChange;
  
  stateChangeCount++;
  lastStateChange = now;
  
  // Track frequency
  performanceMonitor.recordMetric('stateChangeFrequency', timeSinceLastChange);
  performanceMonitor.recordMetric('stateChangeCount', stateChangeCount);
  
  // Warn if changes are too frequent
  if (timeSinceLastChange < 50 && stateChangeCount > 10) {
    console.warn(`🚨 MONITOR: Rapid state changes detected! ${actionName} - ${stateChangeCount} changes, last change ${timeSinceLastChange}ms ago`);
  }
  
  // Reset counter every 10 seconds
  if (now - lastStateChange > 10000) {
    stateChangeCount = 0;
  }
  
  console.log(`📊 MONITOR: State change: ${actionName} (${stateChangeCount} total, ${timeSinceLastChange}ms since last)`);
}

// Recovery utilities
export function enableDebugMode() {
  sessionStorage.setItem('debug-monitor', 'true');
  console.log('🔧 DEBUG: Debug monitor enabled');
}

export function disableDebugMode() {
  sessionStorage.removeItem('debug-monitor');
  console.log('🔧 DEBUG: Debug monitor disabled');
}

export function emergencyReset() {
  console.warn('🚨 EMERGENCY: Performing emergency reset...');
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear store state
  try {
    // Import dynamically to avoid circular dependency
    import('@/store/usePartyStore').then(({ usePartyStore }) => {
      usePartyStore.getState().logout();
    });
  } catch (e) {
    console.error('Could not logout via store:', e);
  }
  
  // Reload page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Global error handler
export function setupGlobalErrorHandling() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 GLOBAL: Unhandled promise rejection:', event.reason);
    trackStateChange('unhandledRejection');
  });
  
  // Catch global errors
  window.addEventListener('error', (event) => {
    console.error('🚨 GLOBAL: Global error:', event.error);
    trackStateChange('globalError');
  });
  
  console.log('✅ MONITOR: Global error handling setup complete');
}

// Export utilities for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugPartyHaus = {
    enableDebugMode,
    disableDebugMode,
    emergencyReset,
    getMetrics: () => performanceMonitor.getAllMetrics(),
    clearMetrics: () => performanceMonitor.clear(),
    getStoreState: () => {
      import('@/store/usePartyStore').then(({ usePartyStore }) => {
        return usePartyStore.getState();
      });
    },
  };
  
  console.log('🔧 DEBUG: PartyHaus debug utilities available at window.debugPartyHaus');
}