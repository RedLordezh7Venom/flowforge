
import { Connector } from '../types';
export const GitHubConnector: Connector = {
  config: { name: 'github', displayName: 'GitHub', description: 'GitHub API', color: '#181717', authType: 'apiKey', baseUrl: 'https://api.github.com' },
  operations: {
    getRepos: { name: 'getRepos', displayName: 'List Repos', method: 'GET', path: '/user/repos' },
    createIssue: { name: 'createIssue', displayName: 'Create Issue', method: 'POST', path: '/repos/{owner}/{repo}/issues', parameters: [
      { name: 'owner', displayName: 'Owner', type: 'string', required: true, in: 'path' },
      { name: 'repo', displayName: 'Repo', type: 'string', required: true, in: 'path' },
      { name: 'title', displayName: 'Title', type: 'string', required: true, in: 'body' },
    ]},
  },
  execute: async (op, params, creds) => {
    const token = creds['token'] as string;
    let path = op;
    for (const [k, v] of Object.entries(params)) { path = path.replace('{' + k + '}', String(v)); }
    const res = await fetch('https://api.github.com' + path, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' } });
    return res.json();
  },
};
