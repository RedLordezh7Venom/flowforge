
import { LLMGateway } from './llm-gateway';
import { AIAgentConfig, AITool, LLMMessage } from './types';

export class AIAgent {
  private gateway: LLMGateway;
  private config: AIAgentConfig;
  private conversation: LLMMessage[] = [];

  constructor(config: AIAgentConfig) {
    this.config = config;
    this.gateway = new LLMGateway({ provider: config.provider, model: config.model, temperature: config.temperature });
    this.conversation.push({ role: 'system', content: config.systemPrompt });
  }

  async run(userMessage: string): Promise<string> {
    this.conversation.push({ role: 'user', content: userMessage });
    for (let i = 0; i < this.config.maxIterations; i++) {
      const tools = this.config.tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters }));
      const response = await this.gateway.chat(this.conversation, tools.length > 0 ? tools : undefined);
      this.conversation.push({ role: 'assistant', content: response.content });
      if (!response.toolCalls?.length) return response.content;
      for (const tc of response.toolCalls) {
        const tool = this.config.tools.find(t => t.name === tc.name);
        if (tool) {
          const result = await tool.execute(tc.arguments);
          this.conversation.push({ role: 'user', content: JSON.stringify({ tool: tc.name, result }) });
        }
      }
    }
    return 'Max iterations reached';
  }

  getConversation(): LLMMessage[] { return [...this.conversation]; }
  clearConversation(): void { this.conversation = [{ role: 'system', content: this.config.systemPrompt }]; }
}
