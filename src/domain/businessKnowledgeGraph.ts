import type { BusinessContext, BusinessSignal } from "./businessIntelligenceContracts";

export type KnowledgeNodeType =
  | "business"
  | "identity"
  | "domain"
  | "business_model"
  | "product"
  | "service"
  | "customer_segment"
  | "competitor"
  | "pricing"
  | "brand"
  | "region"
  | "metric"
  | "goal"
  | "constraint"
  | "channel";

export type KnowledgeNode = {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  attributes?: Record<string, unknown>;
};

export type KnowledgeEdgeRelation =
  | "HAS_IDENTITY"
  | "HAS_DOMAIN"
  | "HAS_BUSINESS_MODEL"
  | "OFFERS_PRODUCT"
  | "OFFERS_SERVICE"
  | "SERVES_SEGMENT"
  | "COMPETES_WITH"
  | "USES_PRICING"
  | "HAS_BRAND"
  | "OPERATES_IN"
  | "HAS_GOAL"
  | "HAS_CONSTRAINT"
  | "USES_CHANNEL"
  | "OBSERVED_METRIC";

export type KnowledgeEdge = {
  from: string;
  relation: KnowledgeEdgeRelation;
  to: string;
};

export type BusinessKnowledgeGraph = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
};

const slug = (value: string): string => {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const result = normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return result || "unknown";
};

export function buildBusinessKnowledgeGraph(
  context: BusinessContext,
  signals: readonly BusinessSignal[],
): BusinessKnowledgeGraph {
  const businessId = `business:${context.businessId}`;
  const nodes: KnowledgeNode[] = [{
    id: businessId,
    type: "business",
    label: context.name,
    attributes: { updatedAt: context.updatedAt },
  }];
  const edges: KnowledgeEdge[] = [];

  const addList = (
    values: readonly string[] | undefined,
    type: KnowledgeNodeType,
    relation: KnowledgeEdgeRelation,
    prefix: string,
  ) => {
    for (const value of values ?? []) {
      const id = `${prefix}:${slug(value)}`;
      if (!nodes.some((node) => node.id === id)) nodes.push({ id, type, label: value });
      edges.push({ from: businessId, relation, to: id });
    }
  };

  addList(context.operatingRegions, "region", "OPERATES_IN", "region");
  addList(context.products, "product", "OFFERS_PRODUCT", "product");
  addList(context.services, "service", "OFFERS_SERVICE", "service");
  addList(context.customerSegments, "customer_segment", "SERVES_SEGMENT", "segment");
  addList(context.competitors, "competitor", "COMPETES_WITH", "competitor");
  addList(context.goals, "goal", "HAS_GOAL", "goal");
  addList(context.constraints, "constraint", "HAS_CONSTRAINT", "constraint");
  addList(context.channels, "channel", "USES_CHANNEL", "channel");

  if (context.industry) addList([context.industry], "domain", "HAS_DOMAIN", "domain");
  if (context.vertical) addList([context.vertical], "domain", "HAS_DOMAIN", "vertical");
  if (context.businessModel) addList([context.businessModel], "business_model", "HAS_BUSINESS_MODEL", "model");
  if (context.pricingModel) addList([context.pricingModel], "pricing", "USES_PRICING", "pricing");
  if (context.brandPositioning) addList([context.brandPositioning], "brand", "HAS_BRAND", "brand");

  for (const signal of signals) {
    const id = `metric:${signal.source}:${slug(signal.metric)}`;
    if (!nodes.some((node) => node.id === id)) {
      nodes.push({
        id,
        type: "metric",
        label: signal.metric,
        attributes: { source: signal.source, unit: signal.unit, confidence: signal.confidence },
      });
    }
    edges.push({ from: businessId, relation: "OBSERVED_METRIC", to: id });
  }

  return { nodes, edges };
}
