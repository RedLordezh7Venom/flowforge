
import { Connector } from '../types';
export const NotionConnector: Connector = {
  config: { name: 'notion', displayName: 'Notion', description: 'Notion API', color: '#000000', authType: 'apiKey', baseUrl: 'https://api.notion.com/v1' },
  operations: {
    queryDatabase: { name: 'queryDatabase', displayName: 'Query Database', description: 'Query a Notion database', method: 'POST', path: '/databases/{databaseId}/query' },
    createPage: { name: 'createPage', displayName: 'Create Page', description: 'Create a new Notion page', method: 'POST', path: '/pages' },
  },
  execute: async (op, params, creds) => {
    const token = creds['token'] as string;
    const res = await fetch('https://api.notion.com/v1/' + op, {
      method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify(params),
    });
    return res.json();
  },
};
