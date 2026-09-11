import type { BusinessContext, BusinessSignal } from "./businessIntelligenceContracts";

export type KnowledgeNode = {
  id: string;
  type: "business" | "identity" | "domain" | "metric" | "goal" | "constraint" | "channel";
  label: string;
  attributes?: Record<string, unknown>;
};

export type KnowledgeEdge = {
  from: string;
  relation: "HAS_DOMAIN" | "HAS_GOAL" | "HAS_CONSTRAINT" | "USES_CHANNEL" | "OBSERVED_METRIC";
  to: string;
};

export type BusinessKnowledgeGraph = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
};

export function buildBusinessKnowledgeGraph(context: BusinessContext, signals: readonly BusinessSignal[]): BusinessKnowledgeGraph {
  const businessId = `business:${context.businessId}`;
  const nodes: KnowledgeNode[] = [{ id: businessId, type: "business", label: context.name }];
  const edges: KnowledgeEdge[] = [];

  const addList = (values: readonly string[] | undefined, type: KnowledgeNode["type"], relation: KnowledgeEdge["relation"], prefix: string) => {
    for (const value of values ?? []) {
      const id = `${prefix}:${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      nodes.push({ id, type, label: value });
      edges.push({ from: businessId, relation, to: id });
    }
  };

  if (context.industry) {
    const id = `domain:${context.industry.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    nodes.push({ id, type: "domain", label: context.industry });
    edges.push({ from: businessId, relation: "HAS_DOMAIN", to: id });
  }
  addList(context.goals, "goal", "HAS_GOAL", "goal");
  addList(context.constraints, "constraint", "HAS_CONSTRAINT", "constraint");
  addList(context.channels, "channel", "USES_CHANNEL", "channel");

  for (const signal of signals) {
    const id = `metric:${signal.source}:${signal.metric.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (!nodes.some((node) => node.id === id)) nodes.push({ id, type: "metric", label: signal.metric, attributes: { source: signal.source, unit: signal.unit } });
    edges.push({ from: businessId, relation: "OBSERVED_METRIC", to: id });
  }

  return { nodes, edges };
}
