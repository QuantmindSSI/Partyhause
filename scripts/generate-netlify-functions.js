#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const NETLIFY_FUNCTIONS_DIR = './netlify/functions';
const API_DIR = './api';

// Mapping of API files to Netlify function names
const endpointMappings = [
  // Core endpoints
  { api: 'health.ts', function: 'health.ts', name: 'Health Check' },
  { api: 'email.ts', function: 'email.ts', name: 'Send Email' },
  { api: 'email-webhook.ts', function: 'email-webhook.ts', name: 'Email Webhook' },
  { api: 'events.ts', function: 'events.ts', name: 'Events API' },
  { api: 'guests.ts', function: 'guests.ts', name: 'Event Guests' },
  { api: 'timeline.ts', function: 'timeline.ts', name: 'Event Timeline' },
  { api: 'event-templates.ts', function: 'event-templates.ts', name: 'Event Templates' },
  { api: 'create-event-from-template.ts', function: 'create-event-from-template.ts', name: 'Create Event from Template' },
  { api: 'templates.ts', function: 'templates.ts', name: 'Templates' },
  { api: 'test.ts', function: 'test.ts', name: 'Test Endpoint' },
  { api: 'ping.js', function: 'ping.ts', name: 'Ping' },
  
  // PartyCrew endpoints
  { api: 'partycrew/toggle.ts', function: 'partycrew-toggle.ts', name: 'PartyCrew Toggle' },
  { api: 'partycrew/members.ts', function: 'partycrew-members.ts', name: 'PartyCrew Members' },
  { api: 'partycrew/crewing-with.ts', function: 'partycrew-crewing-with.ts', name: 'PartyCrew Crewing With' },
  { api: 'partycrew/requests.ts', function: 'partycrew-requests.ts', name: 'PartyCrew Requests' },
  
  // User endpoints
  { api: 'users/[id].ts', function: 'users-by-id.ts', name: 'User by ID' },
  { api: 'users/suggested.ts', function: 'users-suggested.ts', name: 'Suggested Users' },
  
  // Feed endpoints
  { api: 'feed/crew.ts', function: 'feed-crew.ts', name: 'PartyCrew Feed' },
];

// Template for Netlify function
const createNetlifyFunction = (apiFile, functionName) => {
  const relativePath = `../../api/${apiFile}`;
  
  return `/**
 * Netlify Function: ${functionName}
 * Adapted from Vercel API: ${apiFile}
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
    const { default: vercelHandler } = await import('${relativePath}');
    
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
`;
};

// Generate all Netlify functions
console.log('🚀 Generating Netlify functions...');

for (const mapping of endpointMappings) {
  const functionPath = path.join(NETLIFY_FUNCTIONS_DIR, mapping.function);
  const functionContent = createNetlifyFunction(mapping.api, mapping.name);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(functionPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write function file
  fs.writeFileSync(functionPath, functionContent);
  console.log(`✅ Created ${mapping.function} (${mapping.name})`);
}

console.log(`\n🎉 Generated ${endpointMappings.length} Netlify functions!`);
console.log('\nNext steps:');
console.log('1. Deploy to Netlify');
console.log('2. Set environment variables in Netlify dashboard');
console.log('3. Update API base URL in mobile app');
console.log('4. Test all endpoints');