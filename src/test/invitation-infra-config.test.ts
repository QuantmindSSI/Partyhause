import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('invitation secret infrastructure', () => {
  it('passes one secure Bicep parameter into a Container App secret reference', () => {
    const main = source('infra/main.bicep');
    const resources = source('infra/resources.bicep');
    const parameters = source('infra/main.parameters.json');
    const compiled = source('infra/main.json');

    expect(main).toMatch(/@secure\(\)\s*@minLength\(32\)\s*param invitationTokenSecret string/);
    expect(main).toContain('invitationTokenSecret: invitationTokenSecret');
    expect(resources).toMatch(/@secure\(\)\s*@minLength\(32\)\s*param invitationTokenSecret string/);
    expect(resources).toContain("{ name: 'INVITATION_TOKEN_SECRET', secretRef: 'invitation-token-secret' }");
    expect(resources).toContain("{ name: 'invitation-token-secret', value: invitationTokenSecret }");
    expect(parameters).toContain('"secretName": "InvitationTokenSecret"');
    expect(compiled).toContain('"INVITATION_TOKEN_SECRET"');
    expect(compiled).toContain('"invitation-token-secret"');
  });

  it('validates and passes the GitHub Actions secret without printing its value', () => {
    const workflow = source('.github/workflows/deploy.yml');
    const server = source('server/index.ts');

    expect(workflow).toContain('INVITATION_TOKEN_SECRET: ${{ secrets.INVITATION_TOKEN_SECRET }}');
    expect(workflow).toContain('--parameters invitationTokenSecret="${{ secrets.INVITATION_TOKEN_SECRET }}"');
    expect(server).toContain('assertInvitationTokenSecretConfigured();');
    expect(workflow).not.toContain('echo "${INVITATION_TOKEN_SECRET}"');
  });
});
