/**
 * React Hooks for Performance and State Monitoring
 */

import { useEffect, useRef, useState } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { performanceMonitor, trackStateChange } from '@/lib/monitoring-utils';

// Component render monitoring hook
export function useComponentPerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    
    renderCount.current++;
    renderTimes.current.push(renderTime);
    
    // Keep only last 50 render times
    if (renderTimes.current.length > 50) {
      renderTimes.current.shift();
    }
    
    // Record metrics
    performanceMonitor.recordMetric(`${componentName}_renderTime`, renderTime);
    performanceMonitor.recordMetric(`${componentName}_renderCount`, renderCount.current);
    
    lastRenderTime.current = now;
    
    // Warn about frequent renders
    if (renderCount.current > 50 && renderCount.current % 10 === 0) {
      const avgRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;
      console.warn(`🚨 MONITOR: ${componentName} has rendered ${renderCount.current} times. Average render time: ${avgRenderTime.toFixed(2)}ms`);
    }
  });
  
  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length 
      : 0
  };
}

// Store state monitoring - SIMPLIFIED to prevent render loops
export function useStoreMonitor() {
  const lastLogTimeRef = useRef<number>(0);
  const storeStatsRef = useRef({
    userChanges: 0,
    pageChanges: 0,
    eventChanges: 0,
    lastChange: 'none',
    lastChangeTime: Date.now()
  });
  
  // Only subscribe to one piece of state to minimize re-renders
  const currentPage = usePartyStore(s => s.currentPage);
  
  useEffect(() => {
    const now = Date.now();
    // Only log every 10 seconds at most to prevent spam
    if (now - lastLogTimeRef.current < 10000) return;
    
    console.log('📊 MONITOR: Store activity check - current page:', currentPage);
    lastLogTimeRef.current = now;
    storeStatsRef.current.lastChangeTime = now;
  }, [currentPage]);
  
  return storeStatsRef.current;
}

// Render loop detection hook
export function useRenderLoopDetection(componentName: string, threshold = 100) {
  const renderCount = useRef(0);
  const lastResetTime = useRef(Date.now());
  const [hasRenderLoop, setHasRenderLoop] = useState(false);
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    
    // Reset counter every 5 seconds
    if (now - lastResetTime.current > 5000) {
      renderCount.current = 1;
      lastResetTime.current = now;
      setHasRenderLoop(false);
      return;
    }
    
    // Check for render loop
    if (renderCount.current > threshold) {
      console.error(`🚨 RENDER LOOP DETECTED: ${componentName} has rendered ${renderCount.current} times in ${now - lastResetTime.current}ms`);
      
      // Reset to prevent spam
      renderCount.current = 0;
      lastResetTime.current = now;
      setHasRenderLoop(true);
      
      // Track the issue
      trackStateChange(`renderLoop_${componentName}`);
    }
  });
  
  return hasRenderLoop;
}

// Memory usage monitoring hook
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const percentage = (used / total) * 100;
        
        setMemoryInfo({ used, total, percentage });
        performanceMonitor.recordMetric('memoryUsage', percentage);
        
        // Warn if memory usage is high
        if (percentage > 80) {
          console.warn(`🚨 MONITOR: High memory usage: ${percentage.toFixed(1)}% (${(used / 1024 / 1024).toFixed(1)}MB)`);
        }
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
}

// Performance metrics hook - FIXED to prevent render loops
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState(performanceMonitor.getAllMetrics());
  
  useEffect(() => {
    // Much longer interval to prevent render loops - every 30 seconds instead of 1 second
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getAllMetrics());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
}