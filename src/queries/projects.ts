export const GET_ORGANIZATION_PROJECTS = `
  query GetOrganizationProjects($organization: String!, $first: Int = 10) {
    organization(login: $organization) {
      projectsV2(first: $first) {
        totalCount
        edges {
          node {
            id
            number
            title
            public
            closed
            shortDescription
            fields(first: 20) {
              edges {
                node {
                  id
                  name
                  dataType
                  settings
                }
              }
            }
            items(first: 20) {
              totalCount
              edges {
                node {
                  id
                  title
                  fieldValues(first: 10) {
                    edges {
                      node {
                        field {
                          id
                          name
                          dataType
                        }
                        value
                      }
                    }
                  }
                  content {
                    __typename
                    ... on Issue {
                      number
                      title
                      url
                    }
                    ... on PullRequest {
                      number
                      title
                      url
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

export const GET_PROJECT_DETAILS = `
  query GetProjectDetails($projectId: ID!, $itemsFirst: Int = 50) {
    node(id: $projectId) {
      ... on ProjectV2 {
        id
        number
        title
        shortDescription
        public
        closed
        readme
        fields(first: 20) {
          edges {
            node {
              id
              name
              dataType
              settings
            }
          }
        }
        items(first: $itemsFirst) {
          totalCount
          edges {
            node {
              id
              title
              fieldValues(first: 20) {
                edges {
                  node {
                    field {
                      id
                      name
                      dataType
                    }
                    value
                  }
                }
              }
              content {
                __typename
                ... on Issue {
                  number
                  title
                  url
                  state
                }
                ... on PullRequest {
                  number
                  title
                  url
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;
