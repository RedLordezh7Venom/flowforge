
import { Connector } from '../types';
export const GoogleSheetsConnector: Connector = {
  config: { name: 'googleSheets', displayName: 'Google Sheets', description: 'Google Sheets API', color: '#34A853', authType: 'oauth2', baseUrl: 'https://sheets.googleapis.com/v4' },
  operations: {
    readRows: { name: 'readRows', displayName: 'Read Rows', description: 'Read values from a spreadsheet range', method: 'GET', path: '/spreadsheets/{spreadsheetId}/values/{range}' },
    appendRow: { name: 'appendRow', displayName: 'Append Row', description: 'Append values to a spreadsheet range', method: 'POST', path: '/spreadsheets/{spreadsheetId}/values/{range}:append' },
  },
  execute: async (op, params, creds) => {
    const token = creds['accessToken'] as string;
    let path = op;
    for (const [k, v] of Object.entries(params)) { path = path.replace('{' + k + '}', String(v)); }
    const res = await fetch('https://sheets.googleapis.com/v4' + path, { headers: { Authorization: 'Bearer ' + token } });
    return res.json();
  },
};
