/**
 * Debug Monitor Panel Component
 * 
 * Provides real-time monitoring and debugging information for the application.
 * Shows performance metrics, state changes, and provides emergency controls.
 */

import { useState } from 'react';
import { useStoreMonitor, usePerformanceMetrics, useMemoryMonitor } from '@/hooks/use-monitoring';
import { performanceMonitor, enableDebugMode, disableDebugMode, emergencyReset } from '@/lib/monitoring-utils';

export function DebugMonitorPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const metrics = usePerformanceMetrics();
  const storeStats = useStoreMonitor();
  const memoryInfo = useMemoryMonitor();
  
  // Show debug panel in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !sessionStorage.getItem('debug-monitor')) {
    return null;
  }
  
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 text-xs hover:bg-blue-700"
        title="Toggle Debug Monitor"
      >
        📊
      </button>
      
      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm text-xs font-mono max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-blue-400">Debug Monitor</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Store Changes */}
            <div className="border-b border-gray-600 pb-2">
              <h4 className="font-semibold text-yellow-400 mb-1">Store Changes</h4>
              <div className="space-y-1">
                <div>User: {storeStats.userChanges}</div>
                <div>Page: {storeStats.pageChanges}</div>
                <div>Events: {storeStats.eventChanges}</div>
                <div>Last: {storeStats.lastChange}</div>
                <div className="text-gray-400">
                  {new Date(storeStats.lastChangeTime).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="border-b border-gray-600 pb-2">
              <h4 className="font-semibold text-green-400 mb-1">Performance</h4>
              <div className="space-y-1">
                {Object.entries(metrics).map(([key, data]) => (
                  <div key={key} className="truncate">
                    <span className="text-gray-400">{key.replace('_', ' ')}:</span>
                    <br />
                    <span>Latest: {data.latest.toFixed(1)}ms</span>
                    <br />
                    <span>Avg: {data.average.toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Memory Usage */}
            {memoryInfo && (
              <div className="border-b border-gray-600 pb-2">
                <h4 className="font-semibold text-purple-400 mb-1">Memory</h4>
                <div className="space-y-1">
                  <div>Used: {(memoryInfo.used / 1024 / 1024).toFixed(1)}MB</div>
                  <div>Total: {(memoryInfo.total / 1024 / 1024).toFixed(1)}MB</div>
                  <div className={`${memoryInfo.percentage > 80 ? 'text-red-400' : 'text-gray-300'}`}>
                    Usage: {memoryInfo.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
            
            {/* Controls */}
            <div className="space-y-2">
              <h4 className="font-semibold text-red-400">Controls</h4>
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => performanceMonitor.clear()}
                  className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
                >
                  Clear Metrics
                </button>
                <button 
                  onClick={enableDebugMode}
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                >
                  Enable Debug
                </button>
                <button 
                  onClick={disableDebugMode}
                  className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                >
                  Disable Debug
                </button>
                <button 
                  onClick={() => {
                    if (confirm('This will reset the entire application. Continue?')) {
                      emergencyReset();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                >
                  Emergency Reset
                </button>
              </div>
            </div>
            
            {/* Info */}
            <div className="text-xs text-gray-500 border-t border-gray-600 pt-2">
              <div>Environment: {process.env.NODE_ENV}</div>
              <div>Timestamp: {new Date().toLocaleTimeString()}</div>
              <div className="mt-1">
                Console: <code>window.debugPartyHaus</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}