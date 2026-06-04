import { FastifyInstance } from "fastify";
import { globalRegistry } from "@flowforge/core";

export async function nodeRoutes(app: FastifyInstance) {
  app.get("/api/nodes", async () => {
    const nodes = globalRegistry.list().map(n => ({
      name: n.name, displayName: n.displayName, description: n.description,
      category: n.category, icon: n.icon, color: n.color,
      inputs: n.inputs, outputs: n.outputs, parameters: n.parameters,
    }));
    return { success: true, data: nodes, meta: { total: nodes.length } };
  });

  app.get("/api/nodes/categories", async () => {
    const categories = globalRegistry.getCategories();
    return { success: true, data: categories };
  });
}
