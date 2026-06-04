export class ExpressionEngine {
  private variables: Map<string, unknown> = new Map();

  setVariable(name: string, value: unknown): void { this.variables.set(name, value); }
  getVariable(name: string): unknown { return this.variables.get(name); }

  evaluate(expression: string, context?: Record<string, unknown>): unknown {
    if (!expression || typeof expression !== "string") return expression;
    if (!expression.includes("{{")) return expression;
    return expression.replace(/\{\{(.+?)\}\}/g, (_match, expr) => {
      const value = this.evaluateExpression(expr.trim(), context);
      if (value === undefined || value === null) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    });
  }

  evaluateExpression(expr: string, context?: Record<string, unknown>): unknown {
    try {
      if (expr.startsWith("$json")) return this.evaluateJsonAccess(expr, context);
      if (expr.startsWith("$node(")) return this.evaluateNodeAccess(expr, context);
      if (expr === "$input") return context?.["$input"] ?? context?.inputData;
      if (expr.startsWith("$input.")) return this.evaluateInputMethod(expr, context);
      if (expr.startsWith("$env.")) return process.env[expr.slice(5)];
      if (expr === "$now") return new Date();
      if (expr === "$today") return new Date().toISOString().split("T")[0];
      if (expr.startsWith("$workflow.")) return (context?.["$workflow"] as Record<string, any>)?.[expr.slice(10)];
      if (/^[\d\s+\-*/().]+$/.test(expr)) return Function(`"use strict"; return (${expr})`)();
      if (expr.includes("?") && expr.includes(":")) return this.evaluateTernary(expr, context);
      const variable = this.resolveVariable(expr, context);
      if (variable !== undefined) return variable;
      return expr;
    } catch (error) {
      console.error(`Expression error: ${expr}`, error);
      return undefined;
    }
  }

  private evaluateJsonAccess(expr: string, ctx?: Record<string, unknown>): unknown {
    const json = ctx?.["$json"] ?? ctx?.json ?? {};
    return this.getNestedValue(json, expr.slice(5));
  }

  private evaluateNodeAccess(expr: string, ctx?: Record<string, unknown>): unknown {
    const match = expr.match(/\$node\("([^"]+)"\)(.*)/);
    if (!match) return undefined;
    const [, nodeName, path] = match;
    const nodeData = (ctx?.["$node"] as Record<string, any>)?.[nodeName];
    if (!nodeData) return undefined;
    if (!path || path === ".json") return nodeData.json ?? nodeData;
    return this.getNestedValue(nodeData.json ?? nodeData, path.slice(5));
  }

  private evaluateInputMethod(expr: string, ctx?: Record<string, unknown>): unknown {
    const input = ctx?.["$input"] ?? ctx?.inputData ?? [];
    if (!Array.isArray(input)) return input;
    if (expr === "$input.first()") return input[0];
    if (expr === "$input.last()") return input[input.length - 1];
    if (expr === "$input.all()") return input;
    return input;
  }

  private evaluateTernary(expr: string, ctx?: Record<string, unknown>): unknown {
    const parts = expr.split(/\?|:/);
    if (parts.length !== 3) return expr;
    return this.evaluateExpression(parts[0].trim(), ctx)
      ? this.evaluateExpression(parts[1].trim(), ctx)
      : this.evaluateExpression(parts[2].trim(), ctx);
  }

  private resolveVariable(name: string, ctx?: Record<string, unknown>): unknown {
    if (ctx && name in ctx) return ctx[name];
    return this.variables.get(name);
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    if (!path || !obj || typeof obj !== "object") return obj;
    const keys = path.startsWith(".") ? path.slice(1) : path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  evaluateObject(obj: Record<string, unknown>, ctx?: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") result[key] = this.evaluate(value, ctx);
      else if (typeof value === "object" && value !== null && !Array.isArray(value))
        result[key] = this.evaluateObject(value as Record<string, unknown>, ctx);
      else if (Array.isArray(value))
        result[key] = value.map((item) => {
          if (typeof item === "string") return this.evaluate(item, ctx);
          if (typeof item === "object" && item !== null) return this.evaluateObject(item as Record<string, unknown>, ctx);
          return item;
        });
      else result[key] = value;
    }
    return result;
  }
}
