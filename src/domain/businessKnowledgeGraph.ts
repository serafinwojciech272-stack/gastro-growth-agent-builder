import type {
  BusinessContext,
  BusinessEntity,
  BusinessEntityType,
  BusinessRelationship,
  BusinessSignal,
} from "./universalBusinessCore";

export type BusinessKnowledgeGraph = {
  entities: BusinessEntity[];
  relationships: BusinessRelationship[];
};

const slug = (value: string): string => {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const result = normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return result || "unknown";
};

const entityId = (businessId: string, type: BusinessEntityType, value: string): string =>
  `entity:${businessId}:${type}:${slug(value)}`;

export function buildBusinessKnowledgeGraph(
  context: BusinessContext,
  signals: readonly BusinessSignal[],
): BusinessKnowledgeGraph {
  const business = context.business;
  const now = context.lastUpdatedAt;
  const entities: BusinessEntity[] = [{
    id: business.id,
    businessId: business.id,
    type: "business",
    name: business.name,
    attributes: {
      legalName: business.legalName,
      businessModel: business.businessModel,
      websiteUrl: business.websiteUrl,
      locale: business.locale,
      timezone: business.timezone,
    },
    confidence: 1,
    observedAt: now,
  }];
  const relationships: BusinessRelationship[] = [];
  const seen = new Set<string>();

  const addEntity = (type: BusinessEntityType, name: string, attributes: Record<string, unknown> = {}): string => {
    const id = entityId(business.id, type, name);
    if (!seen.has(id)) {
      seen.add(id);
      entities.push({ id, businessId: business.id, type, name, attributes, confidence: 1, observedAt: now });
    }
    return id;
  };

  const relate = (fromEntityId: string, toEntityId: string, type: BusinessRelationship["type"]) => {
    relationships.push({
      id: `relationship:${fromEntityId}:${type}:${toEntityId}`,
      businessId: business.id,
      fromEntityId,
      toEntityId,
      type,
      confidence: 1,
      source: "business_context",
      observedAt: now,
    });
  };

  for (const location of business.locations) relate(business.id, addEntity("location", location), "located_at");
  for (const product of business.products) relate(business.id, addEntity("product", product), "offers");
  for (const service of business.services) relate(business.id, addEntity("service", service), "offers");
  for (const segment of business.customerSegments) relate(business.id, addEntity("customer_segment", segment), "serves");
  for (const competitor of business.competitors) relate(business.id, addEntity("competitor", competitor), "competes_with");
  for (const channel of business.channels ?? []) relate(business.id, addEntity("channel", channel), "uses");
  for (const goal of context.activeGoals) relate(business.id, addEntity("goal", goal.title, { metric: goal.metric, target: goal.target }), "targets");

  for (const signal of signals) {
    for (const referencedEntityId of signal.entityIds ?? []) {
      if (entities.some((entity) => entity.id === referencedEntityId)) {
        relate(referencedEntityId, addEntity("other", signal.metric ?? signal.type), "influences");
      }
    }
  }

  return { entities, relationships };
}
