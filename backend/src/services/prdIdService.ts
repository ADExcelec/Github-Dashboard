import { getRepoFile, putRepoFile } from './githubContents.js';

interface SequenceState {
  lastNumber: number;
  updatedAt: string;
}

function sequencePath(clientSlug: string, projectSlug: string) {
  return `prd/indices/${clientSlug}/${projectSlug}/sequence.json`;
}

function formatPrdId(value: number) {
  return `PRD-${String(value).padStart(3, '0')}`;
}

export async function reserveNextPrdId(clientSlug: string, projectSlug: string): Promise<string> {
  const path = sequencePath(clientSlug, projectSlug);
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const current = await getRepoFile(path);
    const state: SequenceState = current
      ? JSON.parse(current.content)
      : {
          lastNumber: 0,
          updatedAt: new Date().toISOString(),
        };

    const nextNumber = state.lastNumber + 1;
    const nextState: SequenceState = {
      lastNumber: nextNumber,
      updatedAt: new Date().toISOString(),
    };

    try {
      await putRepoFile({
        path,
        content: `${JSON.stringify(nextState, null, 2)}\n`,
        message: `chore(prd): reserve ${formatPrdId(nextNumber)} for ${clientSlug}/${projectSlug}`,
        sha: current?.sha,
      });

      return formatPrdId(nextNumber);
    } catch (error: unknown) {
      if (attempt === maxRetries) {
        throw new Error(`Unable to reserve PRD ID after ${maxRetries} attempts`);
      }

      const status = typeof error === 'object' && error && 'status' in error ? error.status : undefined;
      if (status !== 409 && status !== 422) {
        throw error;
      }
    }
  }

  throw new Error('Unable to reserve PRD ID');
}
