
export class PromptBuilder {
  private parts: string[] = [];

  add(text: string): this { this.parts.push(text); return this; }
  addSection(title: string, content: string): this { this.parts.push('## ' + title + '\n' + content); return this; }
  addContext(key: string, value: unknown): this { this.parts.push(key + ': ' + JSON.stringify(value)); return this; }
  addInstructions(instructions: string[]): this { this.parts.push('Instructions:\n' + instructions.map((inst, i) => (i + 1) + '. ' + inst).join('\n')); return this; }
  addExamples(examples: Array<{ input: string; output: string }>): this {
    this.parts.push('Examples:' + examples.map(ex => '\nInput: ' + ex.input + '\nOutput: ' + ex.output).join('\n---'));
    return this;
  }
  build(): string { return this.parts.join('\n\n'); }
  reset(): this { this.parts = []; return this; }

  static workflowToPrompt(workflow: { name: string; description?: string; nodes: any[] }): string {
    return new PromptBuilder()
      .add('Workflow: ' + workflow.name)
      .addContext('Description', workflow.description || 'No description')
      .add('Nodes:' + workflow.nodes.map((n, i) => '\n' + (i + 1) + '. ' + n.name + ' (' + n.type + ')').join(''))
      .build();
  }
}
