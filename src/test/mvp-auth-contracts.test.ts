import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createApiClient,
  createMemoryStorage,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '../../packages/core/src';
import { MVP_AUTH_CONTRACTS } from './fixtures/mvp-auth-contracts';

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestAt(index: number): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[index];
  return { url: String(url), init: init ?? {} };
}

describe('IOS-MVP-1 auth contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  it('matches every anonymous request body and response fixture', async () => {
    const client = createApiClient({ baseUrl: 'https://api.example.test', storage: createMemoryStorage() });
    const contracts = MVP_AUTH_CONTRACTS;
    fetchMock
      .mockResolvedValueOnce(response(contracts.signUp.response))
      .mockResolvedValueOnce(response(contracts.resendVerification.response))
      .mockResolvedValueOnce(response(contracts.forgotPassword.response))
      .mockResolvedValueOnce(response(contracts.verifyEmail.response))
      .mockResolvedValueOnce(response(contracts.resetPassword.response));

    const results = await Promise.all([
      client.auth.signUp('host@example.com', 'strong-pass', 'Host', {
        ageEligible: true,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      }),
      client.auth.resendVerification('host@example.com'),
      client.auth.forgotPassword('host@example.com'),
      client.auth.verifyEmail('host@example.com', 'verification-token'),
      client.auth.resetPassword('host@example.com', 'reset-token', 'new-strong-pass'),
    ]);

    const expected = [
      contracts.signUp,
      contracts.resendVerification,
      contracts.forgotPassword,
      contracts.verifyEmail,
      contracts.resetPassword,
    ];
    expected.forEach((contract, index) => {
      const request = requestAt(index);
      expect(request.url).toBe(`https://api.example.test${contract.path}`);
      expect(request.init.method).toBe(contract.method);
      expect(JSON.parse(String(request.init.body))).toEqual(contract.request);
      expect(new Headers(request.init.headers).has('Authorization')).toBe(false);
      expect(results[index].data).toEqual(contract.response);
    });
  });

  it('persists the exact sign-in session response', async () => {
    const storage = createMemoryStorage();
    const client = createApiClient({ baseUrl: 'https://api.example.test', storage });
    const contract = MVP_AUTH_CONTRACTS.signIn;
    fetchMock.mockResolvedValue(response(contract.response));

    const result = await client.auth.signIn(
      contract.request.email,
      contract.request.password,
    );

    const request = requestAt(0);
    expect(request.url).toBe(`https://api.example.test${contract.path}`);
    expect(request.init.method).toBe(contract.method);
    expect(JSON.parse(String(request.init.body))).toEqual(contract.request);
    expect(result.data).toEqual(contract.response);
    expect(await client.auth.getToken()).toBe(contract.response.token);
  });
});
