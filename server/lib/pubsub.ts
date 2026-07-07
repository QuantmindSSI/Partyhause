// server/lib/pubsub.ts — Azure Web PubSub broadcast helper.
//
// Provides `broadcastEvent(hubName, event, data)` which sends a message to all
// connected clients on the given hub. Used by the API routes to notify the
// frontend (via the realtime hook) when data changes so it can refetch.
//
// The connection string is read from the WEBPUBSUB_CONNECTION_STRING env var.
// When the connection string is absent (e.g. local dev), broadcasts are
// silently no-op'd so the rest of the API keeps working.

import { WebPubSubServiceClient } from '@azure/web-pubsub';

// Cache service clients per hub so we don't re-parse the connection string on
// every broadcast.
const clientCache = new Map<string, WebPubSubServiceClient>();

function getClient(hubName: string): WebPubSubServiceClient | null {
  const connectionString = process.env.WEBPUBSUB_CONNECTION_STRING;
  if (!connectionString) return null;

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
 * Broadcast an event to all connected Web PubSub clients on `hubName`.
 *
 * The message is sent as a JSON text payload. Clients listening for `event`
 * (via socket.io-client `socket.on(event, ...)`) will receive `data`.
 *
 * If Web PubSub is not configured (no connection string), this is a no-op.
 * Errors are logged but never thrown so they never break the request flow.
 */
export async function broadcastEvent(
  hubName: string,
  event: string,
  data: BroadcastPayload,
): Promise<void> {
  const client = getClient(hubName);
  if (!client) return;

  try {
    // sendToAll delivers to every connection on the hub. When passed a JSON
    // object (rather than a string), the SDK serializes it as JSON and sets
    // the appropriate content type. We wrap the payload in an envelope that
    // the socket.io-client side can dispatch on `event`.
    const message = { event, data };
    await client.sendToAll(message);
  } catch (err) {
    console.error(`[pubsub] broadcastEvent failed (hub=${hubName}, event=${event}):`, err);
  }
}

export default { broadcastEvent };
