// server/routes/realtime.ts — Azure Web PubSub negotiate endpoint.
//
// GET /api/realtime/negotiate
//   Returns a Web PubSub connection URL that the frontend uses with
//   socket.io-client to establish a realtime connection. The authenticated
//   user's id is embedded in the token so connections can be filtered/ targeted
//   by user on the server side.
//
// Requires auth (requireAuth). When WEBPUBSUB_CONNECTION_STRING is not set the
// endpoint returns 503 so the frontend can fall back to polling/no-op.

import { Router } from 'express';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const HUB_NAME = process.env.WEBPUBSUB_HUB || 'partyhause';

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
    // connections are attributable. We request the socket.io client protocol
    // so the returned URL is compatible with socket.io-client.
    const tokenResponse = await client.getClientAccessToken({
      userId,
      clientProtocol: 'socketio',
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
