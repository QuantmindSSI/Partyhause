/**
 * Netlify Function: Poll Actions API
 * Adapted from Vercel API: poll-actions.ts
 */

import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Import the original Vercel API handler
    const { default: vercelHandler } = await import('../../api/poll-actions.ts');
    
    // Convert Netlify event to Vercel-like request
    const body = event.body ? (event.isBase64Encoded ? 
      Buffer.from(event.body, 'base64').toString() : event.body) : null;
    
    const req = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers || {},
      body: body ? JSON.parse(body) : null,
      query: event.queryStringParameters || {},
    };

    // Mock Vercel response object
    let responseData: any = null;
    let statusCode = 200;
    let responseHeaders: Record<string, string> = { ...headers };

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      },
      send: (data: any) => {
        responseData = data;
        return res;
      },
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
      },
      end: (data?: any) => {
        if (data !== undefined) responseData = data;
      },
    };

    // Call the Vercel handler
    await vercelHandler(req as any, res as any);

    return {
      statusCode,
      headers: responseHeaders,
      body: typeof responseData === 'string' ? responseData : JSON.stringify(responseData || {}),
    };
  } catch (error) {
    console.error('Netlify function error (poll-actions):', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
