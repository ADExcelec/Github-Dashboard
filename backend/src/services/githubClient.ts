import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { env } from '../config/env.js';

export async function createInstallationOctokit() {
  const auth = createAppAuth({
    appId: env.githubAppId,
    privateKey: env.githubAppPrivateKey,
    installationId: env.githubAppInstallationId,
  });

  const installationAuth = await auth({ type: 'installation' });

  return new Octokit({ auth: installationAuth.token });
}
