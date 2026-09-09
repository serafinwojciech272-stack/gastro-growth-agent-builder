export const WEBSITE_BUILDER_STAGES = [
  'Project',
  'Brand Extraction',
  'Content Intelligence',
  'Page Architecture',
  'Visual Direction',
  'AI Layout Generation',
  'Component Generation',
  'Responsive Renderer',
  'Preview',
  'QA',
  'Publish',
] as const;

export type WebsiteBuilderStage = typeof WEBSITE_BUILDER_STAGES[number];

export type WebsiteBuilderProject = {
  id: string;
  name: string;
  sourceUrl: string;
  vertical: string;
  goal: string;
  createdAt: string;
};

export type WebsiteBuilderArtifact = {
  label: string;
  value: string;
  status: 'ready' | 'pending' | 'blocked';
};

export const WEBSITE_BUILDER_STAGE_DESCRIPTIONS: Record<WebsiteBuilderStage, string> = {
  Project: 'Define the project, source, vertical and conversion objective.',
  'Brand Extraction': 'Extract brand signals, positioning, visual language and trust evidence.',
  'Content Intelligence': 'Structure factual content, entities, claims, CTAs and content gaps.',
  'Page Architecture': 'Turn the business model into a conversion-first page tree and section schema.',
  'Visual Direction': 'Define typography, color, density, imagery direction, motion and interaction rules.',
  'AI Layout Generation': 'Generate a page layout from the approved content and visual system.',
  'Component Generation': 'Map the layout to reusable production components and variants.',
  'Responsive Renderer': 'Render desktop, tablet and mobile states from one component model.',
  Preview: 'Provide an interactive preview with viewport controls and artifact inspection.',
  QA: 'Run structural, accessibility, responsive, content and runtime quality checks.',
  Publish: 'Prepare a production build and release only after the quality gates pass.',
};

export function createWebsiteBuilderProject(input: Omit<WebsiteBuilderProject, 'id' | 'createdAt'>): WebsiteBuilderProject {
  return {
    ...input,
    id: `wb_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
}
