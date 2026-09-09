export type PublishProvider = 'render' | 'vercel';
export type PublishRequest = { projectId: string; provider: PublishProvider; environment: 'preview' | 'production'; releaseVersion: number };
export type PublishArtifact = {
  schemaVersion: '1.0';
  type: 'publish-release';
  provider: PublishProvider;
  environment: 'preview' | 'production';
  releaseVersion: number;
  status: 'pending' | 'published' | 'failed' | 'rolled_back';
  deploymentId?: string;
  deploymentUrl?: string;
  rollbackRef?: string;
  createdAt: string;
};

export interface WebsitePublishAdapter {
  readonly provider: PublishProvider;
  publish(request: PublishRequest): Promise<PublishArtifact>;
  rollback(release: PublishArtifact): Promise<PublishArtifact>;
}

export function canPublish(qa: { releaseGate: 'PASS' | 'PASS_WITH_WARNINGS' | 'BLOCKED'; score: number }, project: { active_stage: number; version: number }): boolean {
  return qa.releaseGate !== 'BLOCKED' && qa.score >= 90 && project.active_stage >= 10 && project.version > 0;
}
