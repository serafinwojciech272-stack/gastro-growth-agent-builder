import type {
  Business,
  BusinessContext,
  BusinessEntity,
  BusinessRelationship,
  BusinessSignal,
  Evidence,
} from "./universalBusinessCore";

export type BusinessGraphNode = Business | BusinessEntity;
export type BusinessGraphEdge = BusinessRelationship;

export type BusinessKnowledgeGraph = {
  business: Business;
  context: BusinessContext;
  nodes: BusinessGraphNode[];
  edges: BusinessGraphEdge[];
  signals: BusinessSignal[];
  evidence: Evidence[];
  updatedAt: string;
};

export function createBusinessKnowledgeGraph(
  business: Business,
  context: BusinessContext,
): BusinessKnowledgeGraph {
  return {
    business,
    context,
    nodes: [],
    edges: [],
    signals: [],
    evidence: [],
    updatedAt: new Date().toISOString(),
  };
}

export function addBusinessEntity(
  graph: BusinessKnowledgeGraph,
  entity: BusinessEntity,
): BusinessKnowledgeGraph {
  if (graph.nodes.some((node) => node.id === entity.id)) return graph;
  return {
    ...graph,
    nodes: [...graph.nodes, entity],
    updatedAt: new Date().toISOString(),
  };
}

export function addBusinessRelationship(
  graph: BusinessKnowledgeGraph,
  relationship: BusinessRelationship,
): BusinessKnowledgeGraph {
  const exists = graph.edges.some((edge) => edge.id === relationship.id);
  if (exists) return graph;
  return {
    ...graph,
    edges: [...graph.edges, relationship],
    updatedAt: new Date().toISOString(),
  };
}

export function addBusinessSignal(
  graph: BusinessKnowledgeGraph,
  signal: BusinessSignal,
): BusinessKnowledgeGraph {
  if (graph.signals.some((item) => item.id === signal.id)) return graph;
  return {
    ...graph,
    signals: [...graph.signals, signal],
    updatedAt: new Date().toISOString(),
  };
}

export function addEvidence(
  graph: BusinessKnowledgeGraph,
  evidence: Evidence,
): BusinessKnowledgeGraph {
  if (graph.evidence.some((item) => item.id === evidence.id)) return graph;
  return {
    ...graph,
    evidence: [...graph.evidence, evidence],
    updatedAt: new Date().toISOString(),
  };
}

export function getBusinessEntity(
  graph: BusinessKnowledgeGraph,
  entityId: string,
): BusinessEntity | undefined {
  return graph.nodes.find(
    (node): node is BusinessEntity => node.id === entityId && node.type === "entity",
  );
}

export function getRelatedEntities(
  graph: BusinessKnowledgeGraph,
  entityId: string,
): BusinessEntity[] {
  const relatedIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.sourceId === entityId) relatedIds.add(edge.targetId);
    if (edge.targetId === entityId) relatedIds.add(edge.sourceId);
  }

  return graph.nodes.filter(
    (node): node is BusinessEntity => node.type === "entity" && relatedIds.has(node.id),
  );
}
