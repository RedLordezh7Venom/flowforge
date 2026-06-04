
import { Connector, ConnectorConfig, ConnectorOperation } from '../types';
export const HTTPConnector: Connector = {
  config: { name: 'http', displayName: 'HTTP', description: 'Generic HTTP connector', authType: 'none', baseUrl: '' },
  operations: {
    request: { name: 'request', displayName: 'HTTP Request', description: 'Make HTTP request', method: 'GET', path: '', parameters: [
      { name: 'url', displayName: 'URL', type: 'string', required: true, in: 'query' },
      { name: 'method', displayName: 'Method', type: 'select', default: 'GET', in: 'query' },
    ]},
  },
  execute: async (op, params) => {
    const url = params['url'] as string;
    const method = (params['method'] as string) || 'GET';
    const res = await fetch(url, { method });
    return { status: res.status, body: await res.json().catch(() => res.text()) };
  },
};
