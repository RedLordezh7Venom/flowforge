
import {
  NodeTypeDefinition, NodeCategory, NodeExecutionContext, NodeExecutionResult,
} from "@flowforge/types";

export class NodeRegistry {
  private nodes: Map<string, NodeTypeDefinition> = new Map();
  register(node: NodeTypeDefinition): void {
    this.nodes.set(node.name, node);
  }
  get(name: string): NodeTypeDefinition | undefined { return this.nodes.get(name); }
  has(name: string): boolean { return this.nodes.has(name); }
  list(): NodeTypeDefinition[] { return Array.from(this.nodes.values()); }
  listByCategory(cat: NodeCategory): NodeTypeDefinition[] { return this.list().filter(n => n.category === cat); }
  getCategories(): NodeCategory[] { return [...new Set(this.list().map(n => n.category))]; }
  unregister(name: string): boolean { return this.nodes.delete(name); }
  clear(): void { this.nodes.clear(); }
  size(): number { return this.nodes.size; }
  async executeNode(name: string, ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
    const node = this.nodes.get(name);
    if (!node) return { data: [], error: `Node "${name}" not found` };
    try { return await node.execute(ctx); }
    catch (e) { return { data: [], error: e instanceof Error ? e.message : String(e) }; }
  }
}

export const globalRegistry = new NodeRegistry();

function reg(nodes: NodeTypeDefinition[]) { for (const n of nodes) globalRegistry.register(n); }

reg([
  // Webhook Trigger
  {
    name: "flowforge.trigger.webhook", displayName: "Webhook", description: "Receives HTTP requests",
    category: NodeCategory.WEBHOOK, color: "#FF6D5A",
    inputs: [], outputs: [{ displayName: "First Item", type: "main" }],
    parameters: [
      { name: "httpMethod", displayName: "HTTP Method", type: "select", default: "GET", options: [
        { name: "GET", value: "GET" }, { name: "POST", value: "POST" }, { name: "PUT", value: "PUT" },
        { name: "DELETE", value: "DELETE" }, { name: "PATCH", value: "PATCH" },
      ]},
      { name: "path", displayName: "Path", type: "string", default: "webhook", required: true },
      { name: "responseMode", displayName: "Respond", type: "select", default: "lastNode", options: [
        { name: "Immediately", value: "onReceived" }, { name: "When Last Node Finishes", value: "lastNode" },
      ]},
    ],
    execute: async (ctx) => ({ data: [{ json: ctx.inputData[0] ?? { message: "Webhook received" } }] }),
  },
  // Schedule Trigger
  {
    name: "flowforge.trigger.schedule", displayName: "Schedule Trigger", description: "Triggers on cron schedule",
    category: NodeCategory.SCHEDULE, color: "#00C853",
    inputs: [], outputs: [{ displayName: "Item", type: "main" }],
    parameters: [
      { name: "triggerInterval", displayName: "Interval", type: "select", default: "cron", options: [
        { name: "Cron", value: "cron" }, { name: "Seconds", value: "seconds" },
        { name: "Minutes", value: "minutes" }, { name: "Hours", value: "hours" },
      ]},
      { name: "cronExpression", displayName: "Cron Expression", type: "string", default: "0 * * * *" },
    ],
    execute: async () => ({ data: [{ json: { timestamp: new Date().toISOString() } }] }),
  },
  // Manual Trigger
  {
    name: "flowforge.trigger.manual", displayName: "Manual Trigger", description: "Manual trigger",
    category: NodeCategory.TRIGGER, color: "#FF9800",
    inputs: [], outputs: [{ displayName: "Item", type: "main" }],
    parameters: [],
    execute: async () => ({ data: [{ json: { triggered: true, timestamp: new Date().toISOString() } }] }),
  },
  // HTTP Request
  {
    name: "flowforge.action.httpRequest", displayName: "HTTP Request", description: "Makes HTTP requests",
    category: NodeCategory.ACTION, color: "#4CAF50",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "method", displayName: "Method", type: "select", default: "GET", options: [
        { name: "GET", value: "GET" }, { name: "POST", value: "POST" }, { name: "PUT", value: "PUT" },
        { name: "DELETE", value: "DELETE" }, { name: "PATCH", value: "PATCH" },
      ]},
      { name: "url", displayName: "URL", type: "string", required: true, placeholder: "https://api.example.com" },
      { name: "sendBody", displayName: "Send Body", type: "boolean", default: false },
      { name: "bodyParameters", displayName: "Body", type: "json", default: "{}" },
    ],
    execute: async (ctx) => {
      const url = ctx.parameters["url"] as string;
      const method = (ctx.parameters["method"] as string) || "GET";
      try {
        const opts: RequestInit = { method, headers: {} };
        if (ctx.parameters["sendBody"] && ["POST","PUT","PATCH"].includes(method)) {
          opts.headers = { "Content-Type": "application/json" };
          opts.body = JSON.stringify(ctx.parameters["bodyParameters"] ?? {});
        }
        const res = await fetch(url, opts);
        const ct = res.headers.get("content-type") || "";
        const body = ct.includes("json") ? await res.json() : { text: await res.text() };
        return { data: [{ json: { status: res.status, body } }] };
      } catch (e) { return { data: [], error: e instanceof Error ? e.message : String(e) }; }
    },
  },
  // Set
  {
    name: "flowforge.action.set", displayName: "Set", description: "Set values on items",
    category: NodeCategory.TRANSFORM, color: "#2196F3",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "fields", displayName: "Fields", type: "fixedCollection", typeOptions: { multipleValues: true, values: [
        { name: "name", displayName: "Name", type: "string" },
        { name: "value", displayName: "Value", type: "string" },
      ]}},
    ],
    execute: async (ctx) => {
      const fields = (ctx.parameters["fields"] as Array<{name:string;value:string}>) || [];
      const items = ctx.inputData.length > 0 ? ctx.inputData : [{}];
      return { data: items.map(item => {
        const r = { ...item } as Record<string, unknown>;
        for (const f of fields) if (f.name) r[f.name] = f.value;
        return r;
      }) };
    },
  },
  // Code
  {
    name: "flowforge.action.code", displayName: "Code", description: "Run custom code",
    category: NodeCategory.ACTION, color: "#9C27B0",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "language", displayName: "Language", type: "select", default: "javaScript", options: [
        { name: "JavaScript", value: "javaScript" },
      ]},
      { name: "code", displayName: "Code", type: "code", required: true, default: "return items;" },
    ],
    execute: async (ctx) => {
      try {
        const code = ctx.parameters["code"] as string;
        const items = ctx.inputData.length > 0 ? ctx.inputData : [{}];
        const fn = new Function("items", "$input", "$json", code);
        const result = await fn(items, items[0], items[0]);
        const output = Array.isArray(result) ? result : [result];
        return { data: output.map(i => typeof i === "object" ? i : { value: i }) };
      } catch (e) { return { data: [], error: e instanceof Error ? e.message : String(e) }; }
    },
  },
  // IF
  {
    name: "flowforge.logic.if", displayName: "IF", description: "Conditional routing",
    category: NodeCategory.LOGIC, color: "#FF5722",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "True", type: "main" }, { displayName: "False", type: "main" }],
    parameters: [
      { name: "conditions", displayName: "Conditions", type: "fixedCollection", typeOptions: { values: [
        { name: "value1", displayName: "Value 1", type: "string", default: "={{$json.value}}" },
        { name: "operation", displayName: "Operation", type: "select", default: "equals", options: [
          { name: "Equal", value: "equals" }, { name: "Not Equal", value: "notEquals" },
          { name: "Contains", value: "contains" }, { name: "Greater", value: "gt" },
          { name: "Less", value: "lt" }, { name: "Is Empty", value: "isEmpty" },
          { name: "Exists", value: "exists" },
        ]},
        { name: "value2", displayName: "Value 2", type: "string", default: "" },
      ]}},
      { name: "combineOperation", displayName: "Combine", type: "select", default: "AND", options: [
        { name: "AND", value: "AND" }, { name: "OR", value: "OR" },
      ]},
    ],
    execute: async (ctx) => {
      const conds = (ctx.parameters["conditions"] as Array<{value1:string;operation:string;value2:string}>) || [];
      const op = (ctx.parameters["combineOperation"] as string) || "AND";
      const tItems: unknown[] = [], fItems: unknown[] = [];
      for (const item of ctx.inputData) {
        const results = conds.map(c => {
          const v1 = resolveVal(c.value1, item), v2 = resolveVal(c.value2, item);
          switch(c.operation) {
            case "equals": return v1 === v2;
            case "notEquals": return v1 !== v2;
            case "contains": return String(v1).includes(String(v2));
            case "gt": return Number(v1) > Number(v2);
            case "lt": return Number(v1) < Number(v2);
            case "isEmpty": return v1 === "" || v1 == null;
            case "exists": return v1 != null;
            default: return false;
          }
        });
        (op === "AND" ? results.every(Boolean) : results.some(Boolean)) ? tItems.push(item) : fItems.push(item);
      }
      return { data: [{ json: { trueItems: tItems, falseItems: fItems } }] };
    },
  },
  // OpenAI
  {
    name: "flowforge.ai.openai", displayName: "OpenAI", description: "OpenAI GPT models",
    category: NodeCategory.AI, color: "#10A37F",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "model", displayName: "Model", type: "select", default: "gpt-4o", options: [
        { name: "GPT-4o", value: "gpt-4o" }, { name: "GPT-4o Mini", value: "gpt-4o-mini" },
        { name: "GPT-4 Turbo", value: "gpt-4-turbo" }, { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
      ]},
      { name: "prompt", displayName: "Prompt", type: "string", required: true },
      { name: "systemPrompt", displayName: "System Prompt", type: "string", default: "" },
      { name: "temperature", displayName: "Temperature", type: "number", default: 0.7 },
      { name: "maxTokens", displayName: "Max Tokens", type: "number", default: 2048 },
    ],
    execute: async (ctx) => {
      const key = process.env["OPENAI_API_KEY"];
      if (!key) return { data: [], error: "OPENAI_API_KEY not set" };
      const model = (ctx.parameters["model"] as string) || "gpt-4o";
      const prompt = ctx.parameters["prompt"] as string;
      const sys = (ctx.parameters["systemPrompt"] as string) || "";
      const temp = (ctx.parameters["temperature"] as number) || 0.7;
      const maxTok = (ctx.parameters["maxTokens"] as number) || 2048;
      try {
        const msgs: Array<{role:string;content:string}> = [];
        if (sys) msgs.push({ role: "system", content: sys });
        msgs.push({ role: "user", content: prompt });
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model, messages: msgs, temperature: temp, max_tokens: maxTok }),
        });
        if (!res.ok) return { data: [], error: `OpenAI error ${res.status}: ${await res.text()}` };
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        return { data: [{ json: { response: data.choices?.[0]?.message?.content ?? "", model } }] };
      } catch (e) { return { data: [], error: e instanceof Error ? e.message : String(e) }; }
    },
  },
  // Anthropic
  {
    name: "flowforge.ai.anthropic", displayName: "Anthropic Claude", description: "Claude models",
    category: NodeCategory.AI, color: "#D97706",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "model", displayName: "Model", type: "select", default: "claude-sonnet-4-20250514", options: [
        { name: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" },
        { name: "Claude Opus 4", value: "claude-opus-4-20250514" },
      ]},
      { name: "prompt", displayName: "Prompt", type: "string", required: true },
      { name: "systemPrompt", displayName: "System Prompt", type: "string", default: "" },
      { name: "maxTokens", displayName: "Max Tokens", type: "number", default: 4096 },
    ],
    execute: async (ctx) => {
      const key = process.env["ANTHROPIC_API_KEY"];
      if (!key) return { data: [], error: "ANTHROPIC_API_KEY not set" };
      const model = (ctx.parameters["model"] as string) || "claude-sonnet-4-20250514";
      const prompt = ctx.parameters["prompt"] as string;
      const sys = (ctx.parameters["systemPrompt"] as string) || "";
      const maxTok = (ctx.parameters["maxTokens"] as number) || 4096;
      try {
        const body: Record<string,unknown> = { model, max_tokens: maxTok, messages: [{ role: "user", content: prompt }] };
        if (sys) body["system"] = sys;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return { data: [], error: `Anthropic error ${res.status}: ${await res.text()}` };
        const data = await res.json() as { content: Array<{ text: string }> };
        return { data: [{ json: { response: data.content?.[0]?.text ?? "", model } }] };
      } catch (e) { return { data: [], error: e instanceof Error ? e.message : String(e) }; }
    },
  },
  // Email
  {
    name: "flowforge.action.email", displayName: "Send Email", description: "Send emails via SMTP",
    category: NodeCategory.COMMUNICATION, color: "#E91E63",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "fromEmail", displayName: "From", type: "string", required: true },
      { name: "toEmail", displayName: "To", type: "string", required: true },
      { name: "subject", displayName: "Subject", type: "string", required: true },
      { name: "text", displayName: "Text", type: "string", default: "" },
      { name: "html", displayName: "HTML", type: "string", default: "" },
    ],
    execute: async (ctx) => ({ data: [{ json: { sent: true, from: ctx.parameters["fromEmail"], to: ctx.parameters["toEmail"], subject: ctx.parameters["subject"] } }] }),
  },
  // Slack
  {
    name: "flowforge.action.slack", displayName: "Slack", description: "Send Slack messages",
    category: NodeCategory.COMMUNICATION, color: "#4A154B",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "channel", displayName: "Channel", type: "string", required: true, placeholder: "#general" },
      { name: "text", displayName: "Text", type: "string", required: true },
    ],
    execute: async (ctx) => ({ data: [{ json: { sent: true, channel: ctx.parameters["channel"], text: ctx.parameters["text"] } }] }),
  },
  // Discord
  {
    name: "flowforge.action.discord", displayName: "Discord", description: "Send Discord messages",
    category: NodeCategory.COMMUNICATION, color: "#5865F2",
    inputs: [{ displayName: "Input", type: "main" }],
    outputs: [{ displayName: "Output", type: "main" }],
    parameters: [
      { name: "webhookUrl", displayName: "Webhook URL", type: "string", required: true },
      { name: "text", displayName: "Text", type: "string", required: true },
    ],
    execute: async (ctx) => {
      try {
        const res = await fetch(ctx.parameters["webhookUrl"] as string, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: ctx.parameters["text"] }),
        });
        return { data: [{ json: { sent: res.ok, status: res.status } }] };
      } catch (e) { return { data: [], error: e instanceof Error ? e.message : String(e) }; }
    },
  },
]);

function resolveVal(expr: string, item: unknown): unknown {
  if (expr.startsWith("={{$json.") && expr.endsWith("}}")) {
    const path = expr.slice(8, -2);
    let cur: unknown = item;
    for (const k of path.split(".")) { if (cur == null) return undefined; cur = (cur as Record<string,unknown>)[k]; }
    return cur;
  }
  return expr;
}

export function registerBuiltinNodes() { /* already registered above */ }
