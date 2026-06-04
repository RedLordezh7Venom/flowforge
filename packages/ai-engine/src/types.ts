
export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'custom';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
}

export interface AIAgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  provider: LLMProvider;
  tools: AITool[];
  maxIterations: number;
  temperature: number;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}
