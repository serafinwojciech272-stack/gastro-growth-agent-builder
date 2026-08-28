export type WebsitePreviewStage = "analyzing" | "concept_ready" | "build_ready" | "building" | "published" | "failed";

export type WebsitePreview = {
  id: string;
  sourceUrl: string;
  businessName: string;
  vertical: string;
  stage: WebsitePreviewStage;
  positioning: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  improvements: string[];
  palette: { background: string; accent: string; text: string };
  confidence: number;
  createdAt: string;
};

export type WebsiteBuildPlan = {
  previewId: string;
  routeMap: string[];
  sections: string[];
  components: string[];
  conversionGoals: string[];
  seoTasks: string[];
  mobileTasks: string[];
  status: "ready" | "blocked";
};

export function createBuildPlan(preview: WebsitePreview): WebsiteBuildPlan {
  const hasCoreCopy = Boolean(preview.headline && preview.subheadline && preview.primaryCta);
  return {
    previewId: preview.id,
    routeMap: ["/", "/services", "/about", "/contact"],
    sections: ["hero", "proof", "services", "benefits", "faq", "cta", "footer"],
    components: ["Header", "Hero", "TrustSignals", "ServiceGrid", "BenefitGrid", "FAQ", "FinalCTA", "Footer"],
    conversionGoals: [preview.primaryCta, "contact", "mobile conversion"],
    seoTasks: ["title and meta description", "semantic headings", "local business signals", "structured internal links"],
    mobileTasks: ["touch targets", "responsive typography", "sticky primary CTA", "performance budget"],
    status: hasCoreCopy && preview.confidence >= 0.6 ? "ready" : "blocked",
  };
}
