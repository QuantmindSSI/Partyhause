/**
 * Netlify Function: User by ID
 * Adapted from Vercel API: users/[id].ts
 * Auto-generated - do not edit directly
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
    const { default: vercelHandler } = await import('../../api/users/[id].ts');
    
    // Convert Netlify event to Vercel-like request
    const body = event.body ? (event.isBase64Encoded ? 
      Buffer.from(event.body, 'base64').toString() : event.body) : null;

    // Extract path params — Netlify puts them in event.path, not queryStringParameters
    // Path format: /api/users/{id} or /users/{id}
    const pathSegments = (event.path || '').split('/').filter(Boolean);
    const userIdFromPath = pathSegments.length >= 2 ? pathSegments[pathSegments.length - 1] : null;
    const query = { ...(event.queryStringParameters || {}) };
    if (userIdFromPath && !query.id) {
      query.id = userIdFromPath;
    }
    
    const req = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers || {},
      body: body ? JSON.parse(body) : null,
      query,
    };

    // Mock Vercel response object
    let responseData: any = null;
    let statusCode = 200;
    let responseHeaders = { ...headers };

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
    await vercelHandler(req, res);

    return {
      statusCode,
      headers: responseHeaders,
      body: typeof responseData === 'string' ? responseData : JSON.stringify(responseData || {}),
    };
  } catch (error) {
    console.error('Netlify function error:', error);
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
