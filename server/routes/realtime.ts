// server/routes/realtime.ts — Azure Web PubSub negotiate endpoint.
//
// GET /api/realtime/negotiate
//   Returns a native Web PubSub connection URL that the frontend uses with a
//   plain WebSocket (json.webpubsub.azure.v1 subprotocol). The authenticated
//   user's id is embedded in the token so connections can be filtered/ targeted
//   by user on the server side.
//
// Requires auth (requireAuth). When WEBPUBSUB_CONNECTION_STRING is not set the
// endpoint returns 503 so the frontend can fall back to polling/no-op.

import { Router } from 'express';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { HUB_NAME } from '../lib/pubsub';

const router = Router();

// Cache the service client so we don't re-parse the connection string per request.
let serviceClient: WebPubSubServiceClient | null = null;
let clientInitFailed = false;

function getServiceClient(): WebPubSubServiceClient | null {
  if (clientInitFailed) return null;
  if (serviceClient) return serviceClient;

  const connectionString = process.env.WEBPUBSUB_CONNECTION_STRING;
  if (!connectionString) {
    clientInitFailed = true;
    return null;
  }

  try {
    serviceClient = new WebPubSubServiceClient(connectionString, HUB_NAME);
    return serviceClient;
  } catch (err) {
    console.error('[realtime] Failed to init WebPubSubServiceClient:', err);
    clientInitFailed = true;
    return null;
  }
}

// GET /api/realtime/negotiate
router.get('/negotiate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const client = getServiceClient();
    if (!client) {
      return res.status(503).json({
        error: 'Web PubSub not configured',
        configured: false,
      });
    }

    const userId = req.user!.id;

    // Issue a client access token scoped to this user. The userId is embedded
    // in the token so the server can filter/target messages by user, and so
    // connections are attributable.
    //
    // NATIVE protocol (default `/client/hubs/<hub>` URL): the frontend
    // connects with a plain WebSocket + the `json.webpubsub.azure.v1`
    // subprotocol and receives the `{event,data}` envelopes that
    // server/lib/pubsub.ts broadcasts via sendToAll. (The previous
    // `clientProtocol: 'socketio'` URL pointed clients at the Socket.IO
    // gateway, which native sendToAll messages never reach.)
    const tokenResponse = await client.getClientAccessToken({
      userId,
      expirationTimeInMinutes: 60,
    });

    return res.status(200).json({
      url: tokenResponse.url,
      configured: true,
    });
  } catch (error: unknown) {
    console.error('[realtime] negotiate error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to negotiate realtime connection', message });
  }
});

export default router;
