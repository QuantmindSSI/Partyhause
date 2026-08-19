/**
 * WebMCP bootstrap for PartyHause.
 *
 * Called once from src/main.tsx before React renders so the error capture
 * hooks see every runtime error and the monitoring tools are available to
 * connected agents as soon as the page loads.
 */

import { installGlobalErrorCapture } from './monitor';
import { registerMonitoringTools } from './tools';

const INIT_FLAG = '__partyhausWebMCPInitialized';

export function initWebMCP(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const flags = window as unknown as Record<string, unknown>;
  if (flags[INIT_FLAG] === true) {
    return;
  }
  flags[INIT_FLAG] = true;

  installGlobalErrorCapture();

  const registered = registerMonitoringTools();
  if (registered > 0) {
    console.info(`WebMCP: ${registered} PartyHause monitoring tools registered`);
  } else {
    console.info('WebMCP: modelContext unavailable — monitoring tools not registered');
  }
}
