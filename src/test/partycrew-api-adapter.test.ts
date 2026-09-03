/**
 * Tests for the PartyCrew API adapter.
 *
 * This adapter exists to route five hooks through the shared api-client rather
 * than a second HTTP client of their own. The risk in that change is not the
 * routing, it is the body: the hooks pass `body: JSON.stringify({...})`, while
 * the shared client serialises for them. Handing the string straight through
 * would double-encode it, and the server would receive a JSON string where it
 * expects an object. That failure is silent at the type level and only shows
 * up as a 400 at runtime, so it is pinned here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiPut: (...args: unknown[]) => apiPut(...args),
  apiDelete: (...args: unknown[]) => apiDelete(...args),
}));

import { apiRequest } from '@/features/partycrew/api/client';

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  apiDelete.mockReset();
});

describe('apiRequest body handling', () => {
  it('decodes a JSON string body so it is not double-encoded', async () => {
    apiPost.mockResolvedValue({ data: { ok: true }, error: null });

    await apiRequest('/api/partycrew/toggle', {
      method: 'POST',
      body: JSON.stringify({ creatorId: 'abc', action: 'join' }),
    });

    expect(apiPost).toHaveBeenCalledWith('/api/partycrew/toggle', {
      creatorId: 'abc',
      action: 'join',
    });
    // Specifically NOT the string form.
    expect(apiPost).not.toHaveBeenCalledWith('/api/partycrew/toggle', expect.any(String));
  });

  it('passes a non-JSON string body through unchanged rather than dropping it', async () => {
    apiPost.mockResolvedValue({ data: null, error: null });

    await apiRequest('/api/thing', { method: 'POST', body: 'not-json' });

    expect(apiPost).toHaveBeenCalledWith('/api/thing', 'not-json');
  });

  it('sends no body when none was given', async () => {
    apiPost.mockResolvedValue({ data: null, error: null });

    await apiRequest('/api/thing', { method: 'POST' });

    expect(apiPost).toHaveBeenCalledWith('/api/thing', undefined);
  });
});

describe('apiRequest method routing', () => {
  it('defaults to GET', async () => {
    apiGet.mockResolvedValue({ data: { id: 1 }, error: null });

    await apiRequest('/api/partycrew/toggle?creatorId=x');

    expect(apiGet).toHaveBeenCalledWith('/api/partycrew/toggle?creatorId=x');
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('accepts a lowercase method', async () => {
    apiPost.mockResolvedValue({ data: null, error: null });

    await apiRequest('/api/thing', { method: 'post' });

    expect(apiPost).toHaveBeenCalled();
  });

  it('routes PUT and DELETE', async () => {
    apiPut.mockResolvedValue({ data: null, error: null });
    apiDelete.mockResolvedValue({ data: null, error: null });

    await apiRequest('/api/thing', { method: 'PUT', body: JSON.stringify({ a: 1 }) });
    await apiRequest('/api/thing', { method: 'DELETE' });

    expect(apiPut).toHaveBeenCalledWith('/api/thing', { a: 1 });
    expect(apiDelete).toHaveBeenCalledWith('/api/thing');
  });

  it('rejects an unsupported method instead of silently issuing a GET', async () => {
    await expect(apiRequest('/api/thing', { method: 'PATCH' })).rejects.toThrow(
      /Unsupported method: PATCH/,
    );
  });
});

describe('apiRequest error propagation', () => {
  it('throws the server message so existing try/catch callers still work', async () => {
    apiGet.mockResolvedValue({ data: null, error: { message: 'Forbidden', status: 403 } });

    await expect(apiRequest('/api/partycrew/members')).rejects.toThrow('Forbidden');
  });

  it('returns the payload unwrapped on success', async () => {
    apiGet.mockResolvedValue({ data: { isFollowing: true }, error: null });

    const result = await apiRequest<{ isFollowing: boolean }>('/api/partycrew/toggle');

    expect(result).toEqual({ isFollowing: true });
  });
});
