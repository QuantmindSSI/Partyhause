/**
 * WebMCP bootstrap for PartyHause.
 *
 * Called once from src/main.tsx before React renders so the error capture
 * hooks see every runtime error and the monitoring tools are available to
 * connected agents as soon as the page loads.
 *
 * TRUE NO-OP WITHOUT AN AGENT: when `navigator.modelContext` is absent
 * (every browser without a WebMCP bridge — i.e. all regular users), neither
 * the console wrappers nor the error listeners are installed and nothing is
 * ever recorded. Buffers that nothing can read must not be filled.
 */

import { installGlobalErrorCapture } from './monitor';
import { registerMonitoringTools } from './tools';

const INIT_FLAG = '__partyhausWebMCPInitialized';

function modelContextAvailable(): boolean {
  return typeof (navigator as { modelContext?: unknown }).modelContext !== 'undefined';
}

export function initWebMCP(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const flags = window as unknown as Record<string, unknown>;
  if (flags[INIT_FLAG] === true) {
    return;
  }
  flags[INIT_FLAG] = true;

  if (!modelContextAvailable()) {
    console.info('WebMCP: modelContext unavailable — monitoring disabled');
    return;
  }

  installGlobalErrorCapture();

  const registered = registerMonitoringTools();
  console.info(`WebMCP: ${registered} PartyHause monitoring tools registered`);
}
