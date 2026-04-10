export type PrdStatus = 'Draft' | 'Approved' | 'In Progress' | 'Done';

export interface PrdRequirementInput {
  rfId: string;
  name: string;
  description: string;
  acceptanceCriteria: string[];
  impactedRepositories: string[];
}

export interface CreatePrdPayload {
  requestId: string;
  client: string;
  project: string;
  title: string;
  author: string;
  status: PrdStatus;
  version: number;
  objective: string;
  scope: {
    includes: string[];
    excludes: string[];
  };
  requirements: PrdRequirementInput[];
  nonFunctional: {
    performance: string;
    security: string;
    availability: string;
  };
  risks: string[];
}

export interface CreatePrdResult {
  prdId: string;
  path: string;
  sha: string;
  commitUrl: string;
}
