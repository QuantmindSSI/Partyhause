import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Simplified types to avoid Next.js dependency
interface ApiRequest {
  method?: string;
  url?: string;
  headers?: any;
  body?: any;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (data?: any) => void;
}

// Adapter to convert Vercel API routes to Netlify functions
export function createNetlifyHandler(vercelHandler: (req: ApiRequest, res: ApiResponse) => Promise<void> | void): Handler {
  return async (event: HandlerEvent, context: HandlerContext) => {
    try {
      // Convert Netlify event to Next.js request format
      const url = new URL(event.rawUrl);
      const query: Record<string, string | string[]> = {};
      
      // Add query parameters
      for (const [key, value] of url.searchParams.entries()) {
        if (query[key]) {
          if (Array.isArray(query[key])) {
            (query[key] as string[]).push(value);
          } else {
            query[key] = [query[key] as string, value];
          }
        } else {
          query[key] = value;
        }
      }

      // Add path parameters from event
      if (event.queryStringParameters) {
        Object.assign(query, event.queryStringParameters);
      }

      const req: ApiRequest = {
        method: event.httpMethod,
        url: event.path,
        headers: event.headers as any,
        body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : undefined,
        query,
        cookies: {},
      };

      // Parse cookies from headers
      if (event.headers.cookie) {
        const cookies = event.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
          const [name, value] = cookie.trim().split('=');
          acc[name] = decodeURIComponent(value);
          return acc;
        }, {});
        req.cookies = cookies;
      }

      let responseBody = '';
      let statusCode = 200;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      };

      const res: ApiResponse = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: any) => {
          responseBody = JSON.stringify(data);
          headers['Content-Type'] = 'application/json';
        },
        send: (data: any) => {
          responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        },
        setHeader: (name: string, value: string | string[]) => {
          headers[name] = Array.isArray(value) ? value.join(', ') : value;
        },
        end: (data?: any) => {
          if (data !== undefined) {
            responseBody = typeof data === 'string' ? data : JSON.stringify(data);
          }
        },
      };

      // Handle OPTIONS request for CORS
      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers,
          body: '',
        };
      }

      // Call the Vercel handler
      await vercelHandler(req, res);

      return {
        statusCode,
        headers,
        body: responseBody,
      };
    } catch (error) {
      console.error('Netlify function error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }
  };
}

export default createNetlifyHandler;