import type { CreatePrdPayload, CreatePrdResult } from '../types/prd';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function createPrd(payload: CreatePrdPayload): Promise<CreatePrdResult> {
  const response = await fetch(`${API_BASE_URL}/api/prd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as CreatePrdResult | { error: string };

  if (!response.ok) {
    throw new Error('error' in json ? json.error : 'No fue posible crear el PRD');
  }

  return json as CreatePrdResult;
}
