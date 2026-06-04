
import { Connector } from '../types';
export const DiscordConnector: Connector = {
  config: { name: 'discord', displayName: 'Discord', description: 'Discord webhooks', color: '#5865F2', authType: 'none', baseUrl: 'https://discord.com/api/webhooks' },
  operations: {
    sendWebhook: { name: 'sendWebhook', displayName: 'Send Webhook', description: 'Send a message to a Discord channel via webhook', method: 'POST', path: '', parameters: [
      { name: 'webhookUrl', displayName: 'Webhook URL', type: 'string', required: true, in: 'query' },
      { name: 'content', displayName: 'Content', type: 'string', required: true, in: 'body' },
    ]},
  },
  execute: async (op, params) => {
    const url = params['webhookUrl'] as string;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: params['content'] }) });
    return { success: res.ok, status: res.status };
  },
};
