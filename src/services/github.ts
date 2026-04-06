import type {
  DashboardData,
  GraphQLFieldValueNode,
  GraphQLProjectItemNode,
  OrganizationProjectsGraphQLResponse,
  ProjectDashboard,
  ProjectDashboardItem,
  ProjectMilestone,
} from '../types/github';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

const token = import.meta.env.VITE_GITHUB_TOKEN;
const organization = import.meta.env.VITE_GITHUB_ORG;

if (!token) {
  throw new Error('VITE_GITHUB_TOKEN no esta configurado en .env.local');
}

if (!organization) {
  throw new Error('VITE_GITHUB_ORG no esta configurado en .env.local');
}

const GET_ORGANIZATION_PROJECTS_DASHBOARD = `
  query GetOrganizationProjectsDashboard($organization: String!, $first: Int!, $itemsFirst: Int!) {
    organization(login: $organization) {
      projectsV2(first: $first, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          id
          number
          title
          shortDescription
          public
          closed
          items(first: $itemsFirst) {
            totalCount
            nodes {
              id
              content {
                __typename
                ... on Issue {
                  title
                  url
                  state
                  milestone {
                    title
                    dueOn
                    state
                    closedAt
                  }
                }
                ... on PullRequest {
                  title
                  url
                  state
                }
                ... on DraftIssue {
                  title
                }
              }
              fieldValues(first: 20) {
                nodes {
                  __typename
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    number
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldIterationValue {
                    title
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function extractStatusLabel(item: GraphQLProjectItemNode): string {
  const nativeState = item.content?.state;
  if (nativeState === 'CLOSED') {
    return 'Closed';
  }
  if (nativeState === 'OPEN') {
    return 'Open';
  }

  const candidates = item.fieldValues.nodes.filter((node): node is GraphQLFieldValueNode => {
    if (!node.field?.name) {
      return false;
    }

    const fieldName = node.field.name.toLowerCase();
    return fieldName.includes('status') || fieldName.includes('estado') || fieldName.includes('stage');
  });

  for (const candidate of candidates) {
    if (candidate.__typename === 'ProjectV2ItemFieldSingleSelectValue' && candidate.name) {
      return candidate.name;
    }
    if (candidate.__typename === 'ProjectV2ItemFieldTextValue' && candidate.text) {
      return candidate.text;
    }
    if (candidate.__typename === 'ProjectV2ItemFieldIterationValue' && candidate.title) {
      return candidate.title;
    }
  }

  return 'Sin estado';
}

function extractMilestoneLabel(item: GraphQLProjectItemNode): string {
  const issueMilestone = item.content?.__typename === 'Issue' ? item.content.milestone?.title : undefined;
  if (issueMilestone && issueMilestone.trim().length > 0) {
    return issueMilestone;
  }

  const candidates = item.fieldValues.nodes.filter((node): node is GraphQLFieldValueNode => {
    if (!node.field?.name) {
      return false;
    }

    const fieldName = node.field.name.toLowerCase();
    return fieldName.includes('milestone') || fieldName.includes('hito');
  });

  for (const candidate of candidates) {
    if (candidate.__typename === 'ProjectV2ItemFieldSingleSelectValue' && candidate.name) {
      return candidate.name;
    }
    if (candidate.__typename === 'ProjectV2ItemFieldTextValue' && candidate.text) {
      return candidate.text;
    }
    if (candidate.__typename === 'ProjectV2ItemFieldIterationValue' && candidate.title) {
      return candidate.title;
    }
  }

  return '';
}

function extractMilestoneDueDate(item: GraphQLProjectItemNode): string | undefined {
  const issueDueDate = item.content?.__typename === 'Issue' ? item.content.milestone?.dueOn : undefined;
  if (issueDueDate) {
    return issueDueDate;
  }

  for (const node of item.fieldValues.nodes) {
    if (!node.field?.name) {
      continue;
    }

    const fieldName = node.field.name.toLowerCase();
    const isMilestoneDateField =
      (fieldName.includes('milestone') || fieldName.includes('hito')) &&
      (fieldName.includes('fecha') || fieldName.includes('due') || fieldName.includes('venc'));

    if (isMilestoneDateField && node.__typename === 'ProjectV2ItemFieldDateValue' && node.date) {
      return node.date;
    }
  }

  return undefined;
}

function extractMilestoneState(item: GraphQLProjectItemNode): 'OPEN' | 'CLOSED' | undefined {
  return item.content?.__typename === 'Issue' ? item.content.milestone?.state : undefined;
}

function extractMilestoneClosedAt(item: GraphQLProjectItemNode): string | undefined {
  const closedAt = item.content?.__typename === 'Issue' ? item.content.milestone?.closedAt : undefined;
  return closedAt || undefined;
}

function mapStatusToBucket(statusLabel: string): ProjectDashboardItem['statusBucket'] {
  const normalized = statusLabel.trim().toLowerCase();

  const doneKeywords = ['done', 'complete', 'completed', 'cerrado', 'listo', 'finalizado', 'entregado', 'closed'];
  const inProgressKeywords = ['in progress', 'doing', 'progreso', 'en curso', 'ejecucion', 'ejecución', 'active', 'open'];
  const todoKeywords = ['todo', 'to do', 'backlog', 'pendiente', 'por hacer', 'new'];

  if (doneKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'done';
  }

  if (inProgressKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'in-progress';
  }

  if (todoKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'todo';
  }

  return 'other';
}

function normalizeItem(item: GraphQLProjectItemNode): ProjectDashboardItem {
  const statusLabel = extractStatusLabel(item);
  const bucket = mapStatusToBucket(statusLabel);
  const milestoneTitle = extractMilestoneLabel(item);
  const milestoneDueDate = extractMilestoneDueDate(item);
  const milestoneState = extractMilestoneState(item);
  const milestoneClosedAt = extractMilestoneClosedAt(item);

  return {
    id: item.id,
    title: item.content?.title || 'Item sin titulo',
    url: item.content?.url,
    statusLabel,
    statusBucket: bucket,
    milestoneTitle,
    milestoneDueDate,
    milestoneState,
    milestoneClosedAt,
  };
}

function getEarliestDueDate(items: ProjectDashboardItem[]): string | undefined {
  const dueDates = items
    .map((item) => item.milestoneDueDate)
    .filter((value): value is string => Boolean(value));

  if (!dueDates.length) {
    return undefined;
  }

  return dueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

function getLatestClosedAt(items: ProjectDashboardItem[]): string | undefined {
  const closedDates = items
    .map((item) => item.milestoneClosedAt)
    .filter((value): value is string => Boolean(value));

  if (!closedDates.length) {
    return undefined;
  }

  return closedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function resolveMilestoneState(items: ProjectDashboardItem[], completionRate: number): 'OPEN' | 'CLOSED' {
  const explicitStates = items
    .map((item) => item.milestoneState)
    .filter((value): value is 'OPEN' | 'CLOSED' => value === 'OPEN' || value === 'CLOSED');

  if (explicitStates.includes('OPEN')) {
    return 'OPEN';
  }

  if (explicitStates.includes('CLOSED')) {
    return 'CLOSED';
  }

  return completionRate >= 100 ? 'CLOSED' : 'OPEN';
}

function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function isMilestoneVisible(milestone: ProjectMilestone): boolean {
  if (milestone.state === 'OPEN') {
    return true;
  }

  if (milestone.closedAt) {
    return isCurrentMonth(new Date(milestone.closedAt));
  }

  if (milestone.dueDate) {
    return isCurrentMonth(new Date(milestone.dueDate));
  }

  return false;
}

function groupMilestones(items: ProjectDashboardItem[]): ProjectMilestone[] {
  const groups = new Map<string, ProjectDashboardItem[]>();

  for (const item of items) {
    const key = item.milestoneTitle.trim();
    if (!key) {
      continue;
    }
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  }

  const milestones: ProjectMilestone[] = Array.from(groups.entries()).map(([title, groupedItems]) => {
    const doneItems = groupedItems.filter((item) => item.statusBucket === 'done').length;
    const inProgressItems = groupedItems.filter((item) => item.statusBucket === 'in-progress').length;
    const todoItems = groupedItems.filter((item) => item.statusBucket === 'todo').length;
    const otherItems = groupedItems.filter((item) => item.statusBucket === 'other').length;
    const totalItems = groupedItems.length;
    const completionRate = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    const dueDate = getEarliestDueDate(groupedItems);
    const closedAt = getLatestClosedAt(groupedItems);
    const state = resolveMilestoneState(groupedItems, completionRate);

    return {
      title,
      dueDate,
      closedAt,
      state,
      totalItems,
      doneItems,
      inProgressItems,
      todoItems,
      otherItems,
      completionRate,
    };
  });

  return milestones.sort((a, b) => {
    if (a.state !== b.state) {
      return a.state === 'OPEN' ? -1 : 1;
    }
    if (a.dueDate && b.dueDate) {
      const byDate = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (byDate !== 0) {
        return byDate;
      }
    }
    if (a.dueDate && !b.dueDate) {
      return -1;
    }
    if (!a.dueDate && b.dueDate) {
      return 1;
    }
    if (a.completionRate !== b.completionRate) {
      return b.completionRate - a.completionRate;
    }
    return b.totalItems - a.totalItems;
  });
}

function normalizeProject(project: OrganizationProjectsGraphQLResponse['organization']['projectsV2']['nodes'][number]): ProjectDashboard {
  const items = (project.items.nodes || []).map(normalizeItem);
  const milestones = groupMilestones(items).filter(isMilestoneVisible);

  return {
    id: project.id,
    number: project.number,
    title: project.title,
    shortDescription: project.shortDescription || '',
    closed: project.closed,
    public: project.public,
    totalItems: project.items.totalCount,
    milestones,
    items,
  };
}

export async function queryGitHub<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const payload: { data?: T; errors?: Array<{ message: string }> } = await response.json();

  if (payload.errors?.length) {
    throw new Error(`GraphQL error: ${payload.errors.map((e) => e.message).join(', ')}`);
  }

  if (!payload.data) {
    throw new Error('GraphQL error: respuesta vacia');
  }

  return payload.data;
}

export async function getOrganizationProjectsDashboard(): Promise<DashboardData> {
  const response = await queryGitHub<OrganizationProjectsGraphQLResponse>(GET_ORGANIZATION_PROJECTS_DASHBOARD, {
    organization,
    first: 30,
    itemsFirst: 100,
  });

  const projects = (response.organization.projectsV2.nodes || [])
    .map(normalizeProject)
    .filter((project) => project.milestones.length > 0);

  const totalProjects = projects.length;
  const openProjects = projects.filter((project) => !project.closed).length;
  const closedProjects = projects.filter((project) => project.closed).length;
  const totalItems = projects.reduce((sum, project) => sum + project.totalItems, 0);
  const totalMilestones = projects.reduce((sum, project) => sum + project.milestones.length, 0);
  const allItems = projects.flatMap((project) => project.items);
  const doneItems = allItems.filter((item) => item.statusBucket === 'done').length;
  const inProgressItems = allItems.filter((item) => item.statusBucket === 'in-progress').length;
  const todoItems = allItems.filter((item) => item.statusBucket === 'todo').length;

  const overallCompletionRate = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return {
    organization,
    generatedAt: new Date().toISOString(),
    totals: {
      totalProjects,
      openProjects,
      closedProjects,
      totalItems,
      totalMilestones,
      doneItems,
      inProgressItems,
      todoItems,
      overallCompletionRate,
    },
    projects,
  };
}
