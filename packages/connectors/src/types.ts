
export interface ConnectorConfig {
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  color?: string;
  authType: 'oauth2' | 'apiKey' | 'basic' | 'none';
  baseUrl: string;
  apiVersion?: string;
}

export interface ConnectorOperation {
  name: string;
  displayName: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parameters?: ConnectorParameter[];
  body?: Record<string, unknown>;
}

export interface ConnectorParameter {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  required?: boolean;
  default?: unknown;
  description?: string;
  in: 'query' | 'path' | 'header' | 'body';
}

export interface Connector {
  config: ConnectorConfig;
  operations: Record<string, ConnectorOperation>;
  execute: (operation: string, params: Record<string, unknown>, credentials: Record<string, unknown>) => Promise<unknown>;
  testConnection?: (credentials: Record<string, unknown>) => Promise<boolean>;
}
