
export class PromptBuilder {
  private parts: string[] = [];

  add(text: string): this { this.parts.push(text); return this; }
  addSection(title: string, content: string): this { this.parts.push('## ' + title + '
' + content); return this; }
  addContext(key: string, value: unknown): this { this.parts.push(key + ': ' + JSON.stringify(value)); return this; }
  addInstructions(instructions: string[]): this { this.parts.push('Instructions:
' + instructions.map((inst, i) => (i + 1) + '. ' + inst).join('
')); return this; }
  addExamples(examples: Array<{ input: string; output: string }>): this {
    this.parts.push('Examples:' + examples.map(ex => '
Input: ' + ex.input + '
Output: ' + ex.output).join('
---'));
    return this;
  }
  build(): string { return this.parts.join('

'); }
  reset(): this { this.parts = []; return this; }

  static workflowToPrompt(workflow: { name: string; description?: string; nodes: any[] }): string {
    return new PromptBuilder()
      .add('Workflow: ' + workflow.name)
      .addContext('Description', workflow.description || 'No description')
      .add('Nodes:' + workflow.nodes.map((n, i) => '
' + (i + 1) + '. ' + n.name + ' (' + n.type + ')').join(''))
      .build();
  }
}
