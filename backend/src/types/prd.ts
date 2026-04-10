export type PrdStatus = 'Draft' | 'Approved' | 'In Progress' | 'Done';

export interface PrdGeneralInfo {
  client: string;
  project: string;
  author: string;
  objective: string;
  scopeIncludes: string[];
  scopeExcludes: string[];
  nonFunctional: {
    performance: string;
    security: string;
    availability: string;
  };
  risks: string[];
}

export interface PrdFunctionalRequirement {
  rfId: string;
  name: string;
  description: string;
  acceptanceCriteria: string[];
  impactedRepositories: string[];
}

export interface CreatePrdRequest {
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
  requirements: PrdFunctionalRequirement[];
  nonFunctional: {
    performance: string;
    security: string;
    availability: string;
  };
  risks: string[];
}

export interface CreatePrdResponse {
  prdId: string;
  path: string;
  sha: string;
  commitUrl: string;
}
