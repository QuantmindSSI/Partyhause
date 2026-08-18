// server/lib/pubsub.ts — Azure Web PubSub broadcast helper.
//
// Provides `broadcastEvent(hubName, event, data)` which sends a message to all
// connected clients on the given hub. Used by the API routes to notify the
// frontend (via the realtime hook) when data changes so it can refetch.
//
// PROTOCOL: messages are sent with `sendToAll` as a JSON envelope
// `{ event, data }` over the NATIVE Web PubSub data plane. The frontend
// (src/hooks/use-realtime.ts) connects with a plain WebSocket using the
// `json.webpubsub.azure.v1` subprotocol and dispatches on `envelope.event`.
// Do NOT pair this with socket.io-client — socket.io framing is a different
// wire protocol and native sendToAll payloads never reach socket.io handlers.
//
// The connection string is read from the WEBPUBSUB_CONNECTION_STRING env var.
// When the connection string is absent (e.g. local dev), broadcasts are
// no-op'd (warned once) so the rest of the API keeps working.

import { WebPubSubServiceClient } from '@azure/web-pubsub';

// Single source of truth for the hub name — negotiate and every broadcast
// must agree or clients listen on a hub nothing publishes to.
export const HUB_NAME = process.env.WEBPUBSUB_HUB || 'partyhause';

// Cache service clients per hub so we don't re-parse the connection string on
// every broadcast.
const clientCache = new Map<string, WebPubSubServiceClient>();
let warnedUnconfigured = false;

function getClient(hubName: string): WebPubSubServiceClient | null {
  const connectionString = process.env.WEBPUBSUB_CONNECTION_STRING;
  if (!connectionString) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn(
        '[pubsub] WEBPUBSUB_CONNECTION_STRING not set — realtime broadcasts are disabled (clients fall back to polling).',
      );
    }
    return null;
  }

  const cached = clientCache.get(hubName);
  if (cached) return cached;

  try {
    const client = new WebPubSubServiceClient(connectionString, hubName);
    clientCache.set(hubName, client);
    return client;
  } catch (err) {
    console.error(`[pubsub] Failed to create WebPubSubServiceClient for hub "${hubName}":`, err);
    return null;
  }
}

export interface BroadcastPayload {
  [key: string]: unknown;
}

/**
 * Broadcast an event to all connected Web PubSub clients.
 *
 * The message is sent as a JSON envelope `{ event, data }` on the unified
 * HUB_NAME hub. The `hubName` parameter is kept for backward compatibility
 * but ignored in favor of HUB_NAME so negotiate and broadcast can never
 * split-brain onto different hubs.
 *
 * If Web PubSub is not configured (no connection string), this is a no-op.
 * Errors are logged but never thrown so they never break the request flow.
 */
export async function broadcastEvent(
  _hubName: string,
  event: string,
  data: BroadcastPayload,
): Promise<void> {
  const client = getClient(HUB_NAME);
  if (!client) return;

  try {
    // sendToAll delivers to every connection on the hub. When passed a JSON
    // object (rather than a string), the SDK serializes it as JSON and sets
    // the appropriate content type.
    const message = { event, data };
    await client.sendToAll(message);
  } catch (err) {
    console.error(`[pubsub] broadcastEvent failed (hub=${HUB_NAME}, event=${event}):`, err);
  }
}

export default { broadcastEvent, HUB_NAME };
