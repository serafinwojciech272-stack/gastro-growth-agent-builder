import type {
  Business,
  BusinessContext,
  BusinessEntity,
  BusinessRelationship,
  BusinessSignal,
  Evidence,
} from "./universalBusinessCore";

export type BusinessGraphNode = BusinessEntity;
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

function now(): string {
  return new Date().toISOString();
}

export function createBusinessKnowledgeGraph(
  business: Business,
  context: BusinessContext,
): BusinessKnowledgeGraph {
  return {
    business,
    context,
    nodes: [...context.entities],
    edges: [...context.relationships],
    signals: [],
    evidence: [],
    updatedAt: now(),
  };
}

export function addBusinessEntity(
  graph: BusinessKnowledgeGraph,
  entity: BusinessEntity,
): BusinessKnowledgeGraph {
  if (graph.nodes.some((node) => node.id === entity.id)) return graph;
  return { ...graph, nodes: [...graph.nodes, entity], updatedAt: now() };
}

export function addBusinessRelationship(
  graph: BusinessKnowledgeGraph,
  relationship: BusinessRelationship,
): BusinessKnowledgeGraph {
  if (graph.edges.some((edge) => edge.id === relationship.id)) return graph;
  const hasSource = graph.nodes.some((node) => node.id === relationship.fromEntityId);
  const hasTarget = graph.nodes.some((node) => node.id === relationship.toEntityId);
  if (!hasSource || !hasTarget) return graph;
  return { ...graph, edges: [...graph.edges, relationship], updatedAt: now() };
}

export function addBusinessSignal(
  graph: BusinessKnowledgeGraph,
  signal: BusinessSignal,
): BusinessKnowledgeGraph {
  if (graph.signals.some((item) => item.id === signal.id)) return graph;
  return { ...graph, signals: [...graph.signals, signal], updatedAt: now() };
}

export function addEvidence(
  graph: BusinessKnowledgeGraph,
  evidence: Evidence,
): BusinessKnowledgeGraph {
  if (graph.evidence.some((item) => item.id === evidence.id)) return graph;
  return { ...graph, evidence: [...graph.evidence, evidence], updatedAt: now() };
}

export function getBusinessEntity(
  graph: BusinessKnowledgeGraph,
  entityId: string,
): BusinessEntity | undefined {
  return graph.nodes.find((node) => node.id === entityId);
}

export function getRelatedEntities(
  graph: BusinessKnowledgeGraph,
  entityId: string,
): BusinessEntity[] {
  const relatedIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.fromEntityId === entityId) relatedIds.add(edge.toEntityId);
    if (edge.toEntityId === entityId) relatedIds.add(edge.fromEntityId);
  }

  return graph.nodes.filter((node) => relatedIds.has(node.id));
}
