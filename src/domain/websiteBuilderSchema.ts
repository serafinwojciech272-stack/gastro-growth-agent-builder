export const BUILDER_COMPONENT_REGISTRY = [
  'SiteHeader','Hero','Proof','FeatureGrid','Offer','Media','Timeline','Faq','Venue','About','Testimonials','Contact','Cta','Footer','Gallery','Stats',
] as const;

export type BuilderComponent = typeof BUILDER_COMPONENT_REGISTRY[number];
export type ResponsiveState = { order?: number; hidden?: boolean; stack?: boolean };
export type LayoutNode = {
  id: string;
  component: BuilderComponent;
  contentRefs: string[];
  variant: string;
  layout: { width: string; align: 'start' | 'center' | 'end'; order: number };
  responsive: { mobile: ResponsiveState; tablet: ResponsiveState };
};
export type LayoutPage = { id: string; path: string; nodes: LayoutNode[] };
export type LayoutArtifact = { schemaVersion: '1.0'; type: 'ai-layout'; pages: LayoutPage[] };

export type ComponentInstance = {
  id: string;
  component: BuilderComponent;
  props: { contentRefs: string[]; variant: string };
  accessibility: { landmark: 'banner' | 'contentinfo' | 'region'; headingLevel: 1 | 2 };
};
export type ComponentPage = { id: string; path: string; nodes: ComponentInstance[] };
export type ComponentManifest = {
  schemaVersion: '1.0';
  type: 'component-manifest';
  registryVersion: '1.0';
  allowedComponents: BuilderComponent[];
  pages: ComponentPage[];
};

export type RendererArtifact = {
  schemaVersion: '1.0';
  type: 'responsive-renderer';
  engine: 'growth-advisor-schema-renderer';
  breakpoints: { mobile: number; tablet: number; desktop: number };
  states: Array<'mobile' | 'tablet' | 'desktop'>;
  componentSource: 'controlled-registry';
  inputArtifact: 'Component Generation';
  reducedMotion: boolean;
};

export function isBuilderComponent(value: unknown): value is BuilderComponent {
  return typeof value === 'string' && (BUILDER_COMPONENT_REGISTRY as readonly string[]).includes(value);
}

export function normalizeLayoutNode(value: unknown, index: number): LayoutNode {
  const node = isRecord(value) ? value : {};
  const responsive = isRecord(node.responsive) ? node.responsive : {};
  const layout = isRecord(node.layout) ? node.layout : {};
  const mobile = isRecord(responsive.mobile) ? responsive.mobile : {};
  const tablet = isRecord(responsive.tablet) ? responsive.tablet : {};
  const requested = isBuilderComponent(node.component) ? node.component : 'FeatureGrid';
  return {
    id: typeof node.id === 'string' && node.id ? node.id.slice(0, 100) : `node-${index + 1}`,
    component: requested,
    contentRefs: Array.isArray(node.contentRefs) ? node.contentRefs.filter((x): x is string => typeof x === 'string').slice(0, 20) : [],
    variant: typeof node.variant === 'string' ? node.variant.slice(0, 60) : 'default',
    layout: {
      width: typeof layout.width === 'string' ? layout.width.slice(0, 40) : 'full',
      align: layout.align === 'center' || layout.align === 'end' ? layout.align : 'start',
      order: typeof layout.order === 'number' && Number.isFinite(layout.order) ? layout.order : index,
    },
    responsive: {
      mobile: normalizeResponsive(mobile),
      tablet: normalizeResponsive(tablet),
    },
  };
}

function normalizeResponsive(value: Record<string, unknown>): ResponsiveState {
  return {
    order: typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : undefined,
    hidden: value.hidden === true,
    stack: value.stack === true,
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
