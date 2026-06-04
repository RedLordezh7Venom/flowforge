
import { Connector } from '../types';
export const AirtableConnector: Connector = {
  config: { name: 'airtable', displayName: 'Airtable', description: 'Airtable API', color: '#18BFFF', authType: 'apiKey', baseUrl: 'https://api.airtable.com/v0' },
  operations: {
    listRecords: { name: 'listRecords', displayName: 'List Records', description: 'List records from Airtable table', method: 'GET', path: '/{baseId}/{tableId}' },
    createRecord: { name: 'createRecord', displayName: 'Create Record', description: 'Create a record in Airtable table', method: 'POST', path: '/{baseId}/{tableId}' },
  },
  execute: async (op, params, creds) => {
    const token = creds['token'] as string;
    let path = op;
    for (const [k, v] of Object.entries(params)) { path = path.replace('{' + k + '}', String(v)); }
    const res = await fetch('https://api.airtable.com/v0' + path, { headers: { Authorization: 'Bearer ' + token } });
    return res.json();
  },
};
