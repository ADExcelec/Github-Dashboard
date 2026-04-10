import { Buffer } from 'node:buffer';
import { env } from '../config/env.js';
import { createInstallationOctokit } from './githubClient.js';

export interface RepoFile {
  path: string;
  sha?: string;
  content: string;
}

function encodeBase64(content: string) {
  return Buffer.from(content, 'utf8').toString('base64');
}

export async function getRepoFile(path: string): Promise<RepoFile | null> {
  const octokit = await createInstallationOctokit();

  try {
    const response = await octokit.repos.getContent({
      owner: env.githubOrg,
      repo: env.productDocsRepo,
      path,
    });

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      return null;
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf8');

    return {
      path,
      sha: response.data.sha,
      content,
    };
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'status' in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function putRepoFile(input: {
  path: string;
  content: string;
  message: string;
  sha?: string;
}) {
  const octokit = await createInstallationOctokit();

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: env.githubOrg,
    repo: env.productDocsRepo,
    path: input.path,
    message: input.message,
    content: encodeBase64(input.content),
    sha: input.sha,
    committer: {
      name: 'prd-orchestrator-bot',
      email: 'prd-orchestrator-bot@users.noreply.github.com',
    },
    author: {
      name: 'prd-orchestrator-bot',
      email: 'prd-orchestrator-bot@users.noreply.github.com',
    },
  });

  return {
    sha: response.data.content?.sha ?? '',
    commitUrl: response.data.commit.html_url ?? '',
  };
}
