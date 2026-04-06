export type StatusBucket = 'done' | 'in-progress' | 'todo' | 'other';

export interface ProjectDashboardItem {
  id: string;
  title: string;
  url?: string;
  statusLabel: string;
  statusBucket: StatusBucket;
  milestoneTitle: string;
  milestoneDueDate?: string;
  milestoneState?: 'OPEN' | 'CLOSED';
  milestoneClosedAt?: string;
}

export interface ProjectMilestone {
  title: string;
  dueDate?: string;
  closedAt?: string;
  state: 'OPEN' | 'CLOSED';
  totalItems: number;
  doneItems: number;
  inProgressItems: number;
  todoItems: number;
  otherItems: number;
  completionRate: number;
}

export interface ProjectDashboard {
  id: string;
  number: number;
  title: string;
  shortDescription: string;
  closed: boolean;
  public: boolean;
  totalItems: number;
  milestones: ProjectMilestone[];
  items: ProjectDashboardItem[];
}

export interface DashboardTotals {
  totalProjects: number;
  openProjects: number;
  closedProjects: number;
  totalItems: number;
  totalMilestones: number;
  doneItems: number;
  inProgressItems: number;
  todoItems: number;
  overallCompletionRate: number;
}

export interface DashboardData {
  organization: string;
  generatedAt: string;
  totals: DashboardTotals;
  projects: ProjectDashboard[];
}

export interface OrganizationProjectsGraphQLResponse {
  organization: {
    projectsV2: {
      nodes: GraphQLProjectNode[];
    };
  };
}

export interface GraphQLProjectNode {
  id: string;
  number: number;
  title: string;
  shortDescription?: string | null;
  closed: boolean;
  public: boolean;
  items: {
    totalCount: number;
    nodes: GraphQLProjectItemNode[];
  };
}

export interface GraphQLProjectItemNode {
  id: string;
  content?: {
    __typename: 'Issue' | 'PullRequest' | 'DraftIssue';
    title?: string;
    url?: string;
    state?: 'OPEN' | 'CLOSED';
    milestone?: {
      title: string;
      dueOn?: string | null;
      state?: 'OPEN' | 'CLOSED';
      closedAt?: string | null;
    } | null;
  } | null;
  fieldValues: {
    nodes: GraphQLFieldValueNode[];
  };
}

export type GraphQLFieldValueNode =
  | {
      __typename: 'ProjectV2ItemFieldSingleSelectValue';
      name?: string;
      field?: {
        name: string;
      } | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldTextValue';
      text?: string;
      field?: {
        name: string;
      } | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldNumberValue';
      number?: number;
      field?: {
        name: string;
      } | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldDateValue';
      date?: string;
      field?: {
        name: string;
      } | null;
    }
  | {
      __typename: 'ProjectV2ItemFieldIterationValue';
      title?: string;
      field?: {
        name: string;
      } | null;
    };
