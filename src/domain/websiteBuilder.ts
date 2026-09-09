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
export type WebsiteBuilderStatus = 'draft' | 'running' | 'ready' | 'blocked' | 'published';

export type WebsiteBuilderArtifact = {
  schemaVersion: string;
  type: string;
  [key: string]: unknown;
};

export type WebsiteBuilderProject = {
  id: string;
  organization_id?: string;
  user_id?: string;
  name: string;
  source_url: string;
  vertical: string;
  goal: string;
  status: WebsiteBuilderStatus;
  active_stage: number;
  completed_stages: number[];
  artifacts: Record<string, WebsiteBuilderArtifact>;
  source_snapshot?: Record<string, unknown> | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export const WEBSITE_BUILDER_STAGE_DESCRIPTIONS: Record<WebsiteBuilderStage, string> = {
  Project: 'Define the project, source, vertical and conversion objective.',
  'Brand Extraction': 'Extract source-grounded brand signals, positioning, visual language and trust evidence.',
  'Content Intelligence': 'Structure facts, entities, claims, CTAs, FAQs, gaps and explicitly proposed copy.',
  'Page Architecture': 'Turn content into a deterministic page and section schema.',
  'Visual Direction': 'Define typography, color, spacing, density, imagery, motion and responsive tokens.',
  'AI Layout Generation': 'Generate a constrained layout tree from approved content and visual tokens.',
  'Component Generation': 'Map layout nodes to a controlled production component registry.',
  'Responsive Renderer': 'Render desktop, tablet and mobile states from one schema.',
  Preview: 'Provide an interactive browser preview with viewport controls and artifact inspection.',
  QA: 'Run accessibility, responsive, links, content and runtime quality checks.',
  Publish: 'Release only after all production gates pass, with rollback metadata.',
};
