export type QaCheck = 'accessibility' | 'responsive' | 'links' | 'content' | 'runtime';
export type QaResult = { check: QaCheck; status: 'pass' | 'warn' | 'fail'; score: number; findings: string[] };
export type WebsiteBuilderQaArtifact = {
  schemaVersion: '1.0';
  type: 'qa-report';
  generatedAt: string;
  checks: QaResult[];
  score: number;
  releaseGate: 'PASS' | 'PASS_WITH_WARNINGS' | 'BLOCKED';
};

export function calculateReleaseGate(checks: QaResult[]): WebsiteBuilderQaArtifact['releaseGate'] {
  if (checks.some((check) => check.status === 'fail')) return 'BLOCKED';
  if (checks.some((check) => check.status === 'warn')) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function calculateQaScore(checks: QaResult[]): number {
  if (!checks.length) return 0;
  return Math.round(checks.reduce((sum, check) => sum + Math.max(0, Math.min(100, check.score)), 0) / checks.length);
}
