
import { Connector } from '../types';
export const SlackConnector: Connector = {
  config: { name: 'slack', displayName: 'Slack', description: 'Slack messaging', color: '#4A154B', authType: 'apiKey', baseUrl: 'https://slack.com/api' },
  operations: {
    sendMessage: { name: 'sendMessage', displayName: 'Send Message', description: 'Send message to channel', method: 'POST', path: '/chat.postMessage', parameters: [
      { name: 'channel', displayName: 'Channel', type: 'string', required: true, in: 'body' },
      { name: 'text', displayName: 'Text', type: 'string', required: true, in: 'body' },
    ]},
    getChannels: { name: 'getChannels', displayName: 'List Channels', method: 'GET', path: '/conversations.list' },
  },
  execute: async (op, params, creds) => {
    const token = creds['token'] as string;
    const res = await fetch('https://slack.com/api/' + op, {
      method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },
};
