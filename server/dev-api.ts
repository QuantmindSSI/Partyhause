import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.API_PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/dev-health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Dev API server is running',
    timestamp: new Date().toISOString(),
  });
});

type Handler = (req: any, res: any) => Promise<void> | void;

interface RouteConfig {
  pattern: string;
  handlerPath: string;
  params?: string[];
}

const routes: RouteConfig[] = [
  { pattern: '/api/health', handlerPath: '../api/health.ts' },
  { pattern: '/api/email', handlerPath: '../api/email.ts' },
  { pattern: '/api/send-email', handlerPath: '../api/send-email.ts' },
  { pattern: '/api/email-webhook', handlerPath: '../api/email-webhook.ts' },
  { pattern: '/api/ping', handlerPath: '../api/ping.js' },
  { pattern: '/api/test', handlerPath: '../api/test.ts' },
  { pattern: '/api/guests', handlerPath: '../api/guests.ts' },
  { pattern: '/api/events/:eventId/guests', handlerPath: '../api/guests.ts', params: ['eventId'] },
  { pattern: '/api/timeline', handlerPath: '../api/timeline.ts' },
  { pattern: '/api/events/:eventId/timeline', handlerPath: '../api/timeline.ts', params: ['eventId'] },
  { pattern: '/api/event-templates', handlerPath: '../api/event-templates.ts' },
  { pattern: '/api/create-event-from-template', handlerPath: '../api/create-event-from-template.ts' },
  { pattern: '/api/templates', handlerPath: '../api/templates.ts' },
  { pattern: '/api/templates/:id', handlerPath: '../api/templates/[id].ts', params: ['id'] },
  { pattern: '/api/partycrew/toggle', handlerPath: '../api/partycrew/toggle.ts' },
  { pattern: '/api/partycrew/members', handlerPath: '../api/partycrew/members.ts' },
  { pattern: '/api/partycrew/crewing-with', handlerPath: '../api/partycrew/crewing-with.ts' },
  { pattern: '/api/partycrew/requests', handlerPath: '../api/partycrew/requests.ts' },
  { pattern: '/api/users/suggested', handlerPath: '../api/users/suggested.ts' },
  { pattern: '/api/users/:id', handlerPath: '../api/users/[id].ts', params: ['id'] },
  { pattern: '/api/feed/crew', handlerPath: '../api/feed/crew.ts' },
  { pattern: '/api/polls', handlerPath: '../api/polls.ts' },
  { pattern: '/api/poll-actions', handlerPath: '../api/poll-actions.ts' },
  { pattern: '/api/convert-guest-to-crew', handlerPath: '../api/convert-guest-to-crew.ts' },
  { pattern: '/api/cost-split', handlerPath: '../api/cost-split.ts' },
  { pattern: '/api/generate-invite', handlerPath: '../api/generate-invite.ts' },
  { pattern: '/api/join-event', handlerPath: '../api/join-event.ts' },
  { pattern: '/api/user-connections', handlerPath: '../api/user-connections.ts' },
  { pattern: '/api/events', handlerPath: '../api/events.ts' },
  { pattern: '/api/events/:id', handlerPath: '../api/events.ts', params: ['id'] },
];

async function main() {
  for (const route of routes) {
    try {
      const mod = await import(route.handlerPath);
      const handler: Handler | undefined = mod.default;

      if (!handler) {
        console.warn(`[warn] No default export for ${route.handlerPath}`);
        continue;
      }

      app.all(route.pattern, async (req: any, res: any) => {
        try {
          if (route.params) {
            for (const param of route.params) {
              if (req.params[param] !== undefined) {
                req.query[param] = req.params[param];
              }
            }
          }
          await handler(req, res);
        } catch (err) {
          console.error(`[error] ${route.pattern}:`, err);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Internal server error',
              message: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }
      });

      console.log(`[ok] ${route.pattern} -> ${route.handlerPath}`);
    } catch (err) {
      console.error(
        `[fail] ${route.handlerPath}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nDev API server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/dev-health\n`);
  });
}

main().catch(console.error);
