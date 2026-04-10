import { z } from 'zod';
import type { CreatePrdRequest, CreatePrdResponse } from '../types/prd.js';
import { putRepoFile } from './githubContents.js';
import { reserveNextPrdId } from './prdIdService.js';
import { renderPrdMarkdown } from '../templates/prdTemplate.js';

const createPrdSchema = z.object({
  requestId: z.string().min(8),
  client: z.string().min(2),
  project: z.string().min(2),
  title: z.string().min(5),
  author: z.string().min(2),
  status: z.enum(['Draft', 'Approved', 'In Progress', 'Done']),
  version: z.number().int().positive(),
  objective: z.string().min(10),
  scope: z.object({
    includes: z.array(z.string().min(2)).min(1),
    excludes: z.array(z.string().min(2)).min(1),
  }),
  requirements: z
    .array(
      z.object({
        rfId: z.string().regex(/^RF-[0-9]{2}$/),
        name: z.string().min(3),
        description: z.string().min(10),
        acceptanceCriteria: z.array(z.string().min(3)).min(1),
        impactedRepositories: z.array(z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)).min(1),
      }),
    )
    .min(1),
  nonFunctional: z.object({
    performance: z.string().min(3),
    security: z.string().min(3),
    availability: z.string().min(3),
  }),
  risks: z.array(z.string().min(3)).min(1),
});

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPrdPath(input: { client: string; project: string; prdId: string; title: string }) {
  const clientSlug = toSlug(input.client);
  const projectSlug = toSlug(input.project);
  const titleSlug = toSlug(input.title);

  return `prd/clientes/${clientSlug}/${projectSlug}/${input.prdId}-${titleSlug}.md`;
}

export async function createPrd(rawInput: unknown): Promise<CreatePrdResponse> {
  const input = createPrdSchema.parse(rawInput) as CreatePrdRequest;
  const clientSlug = toSlug(input.client);
  const projectSlug = toSlug(input.project);

  const prdId = await reserveNextPrdId(clientSlug, projectSlug);
  const createdAt = new Date().toISOString().slice(0, 10);
  const markdown = renderPrdMarkdown({ ...input, prdId, createdAt });
  const path = getPrdPath({ ...input, prdId });

  const saved = await putRepoFile({
    path,
    content: markdown,
    message: `feat(prd): create ${prdId} for ${input.client}/${input.project}`,
  });

  return {
    prdId,
    path,
    sha: saved.sha,
    commitUrl: saved.commitUrl,
  };
}
