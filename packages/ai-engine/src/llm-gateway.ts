
import { LLMProvider, LLMMessage, LLMConfig, LLMResponse } from './types';

export class LLMGateway {
  private config: LLMConfig;

  constructor(config: LLMConfig) { this.config = config; }

  async chat(messages: LLMMessage[], tools?: any[]): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'openai': return this.openaiChat(messages, tools);
      case 'anthropic': return this.anthropicChat(messages);
      case 'ollama': return this.ollamaChat(messages);
      default: throw new Error('Unknown provider: ' + this.config.provider);
    }
  }

  private async openaiChat(messages: LLMMessage[], tools?: any[]): Promise<LLMResponse> {
    const apiKey = this.config.apiKey || process.env['OPENAI_API_KEY'];
    if (!apiKey) throw new Error('OpenAI API key not configured');
    const body: Record<string, any> = {
      model: this.config.model, messages,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2048,
    };
    if (tools?.length) body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: { type: 'object', properties: t.parameters } } }));
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('OpenAI error ' + res.status + ': ' + await res.text());
    const data = await res.json() as any;
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? '',
      model: data.model,
      usage: { promptTokens: data.usage?.prompt_tokens ?? 0, completionTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0 },
      finishReason: choice?.finish_reason ?? 'stop',
      toolCalls: choice?.message?.tool_calls?.map((tc: any) => ({ id: tc.id, name: tc.function.name, arguments: JSON.parse(tc.function.arguments) })),
    };
  }

  private async anthropicChat(messages: LLMMessage[]): Promise<LLMResponse> {
    const apiKey = this.config.apiKey || process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new Error('Anthropic API key not configured');
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const body: Record<string, any> = {
      model: this.config.model, max_tokens: this.config.maxTokens ?? 4096,
      messages: userMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    };
    if (systemMsg) body.system = systemMsg.content;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Anthropic error ' + res.status + ': ' + await res.text());
    const data = await res.json() as any;
    return {
      content: data.content?.[0]?.text ?? '',
      model: data.model,
      usage: { promptTokens: data.usage?.input_tokens ?? 0, completionTokens: data.usage?.output_tokens ?? 0, totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) },
      finishReason: data.stop_reason ?? 'stop',
    };
  }

  private async ollamaChat(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    const res = await fetch(baseUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.config.model, messages, stream: false, options: { temperature: this.config.temperature, num_predict: this.config.maxTokens } }),
    });
    if (!res.ok) throw new Error('Ollama error ' + res.status);
    const data = await res.json() as any;
    return { content: data.message?.content ?? '', model: data.model, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, finishReason: 'stop' };
  }
}
