import type { GrowthVerticalId } from "./verticals";

export type VerticalPack = {
  id: GrowthVerticalId;
  diagnosisSignals: readonly string[];
  opportunityPatterns: readonly string[];
  defaultMissionKpis: readonly string[];
  lowRiskActions: readonly string[];
};

const commonActions = [
  "Analyze current performance",
  "Prepare customer-facing content",
  "Prepare a reactivation campaign",
  "Create a measurement plan",
] as const;

export const VERTICAL_PACKS: Record<GrowthVerticalId, VerticalPack> = {
  restaurant: { id: "restaurant", diagnosisSignals: ["weekday_demand", "reviews", "average_ticket", "repeat_customers"], opportunityPatterns: ["increase weekday demand", "improve review velocity", "increase average ticket"], defaultMissionKpis: ["revenue", "reservations", "average_ticket"], lowRiskActions: commonActions },
  beauty: { id: "beauty", diagnosisSignals: ["bookings", "rebooking_rate", "retention", "reviews"], opportunityPatterns: ["increase rebooking", "fill low-demand slots", "increase service value"], defaultMissionKpis: ["bookings", "rebooking_rate", "retention"], lowRiskActions: commonActions },
  barber: { id: "barber", diagnosisSignals: ["bookings", "rebooking_rate", "retention", "reviews"], opportunityPatterns: ["increase rebooking", "reactivate inactive clients", "improve local reviews"], defaultMissionKpis: ["bookings", "rebooking_rate", "retention"], lowRiskActions: commonActions },
  hairdresser: { id: "hairdresser", diagnosisSignals: ["bookings", "rebooking_rate", "retention", "average_ticket"], opportunityPatterns: ["increase rebooking", "reduce empty slots", "increase treatment value"], defaultMissionKpis: ["bookings", "rebooking_rate", "average_ticket"], lowRiskActions: commonActions },
  fitness: { id: "fitness", diagnosisSignals: ["memberships", "retention", "attendance", "leads"], opportunityPatterns: ["reduce churn", "increase trial conversion", "reactivate inactive members"], defaultMissionKpis: ["memberships", "retention", "attendance"], lowRiskActions: commonActions },
  hotel: { id: "hotel", diagnosisSignals: ["occupancy", "adr", "revpar", "direct_bookings", "reviews"], opportunityPatterns: ["increase direct bookings", "improve low-season demand", "increase upsells"], defaultMissionKpis: ["occupancy", "adr", "revpar"], lowRiskActions: commonActions },
  home_services: { id: "home_services", diagnosisSignals: ["qualified_leads", "quote_rate", "win_rate", "reviews"], opportunityPatterns: ["increase qualified leads", "improve quote follow-up", "increase review volume"], defaultMissionKpis: ["qualified_leads", "quote_rate", "win_rate"], lowRiskActions: commonActions },
  construction: { id: "construction", diagnosisSignals: ["qualified_leads", "quote_rate", "win_rate", "project_margin"], opportunityPatterns: ["improve quote conversion", "increase qualified enquiries", "improve local visibility"], defaultMissionKpis: ["qualified_leads", "quote_rate", "win_rate"], lowRiskActions: commonActions },
  property_management: { id: "property_management", diagnosisSignals: ["qualified_leads", "occupancy", "response_time", "retention"], opportunityPatterns: ["increase qualified enquiries", "reduce response time", "improve occupancy"], defaultMissionKpis: ["qualified_leads", "occupancy", "response_time"], lowRiskActions: commonActions },
  dental: { id: "dental", diagnosisSignals: ["bookings", "no_show_rate", "retention", "reviews"], opportunityPatterns: ["reduce no-shows", "increase treatment acceptance", "improve rebooking"], defaultMissionKpis: ["bookings", "no_show_rate", "retention"], lowRiskActions: commonActions },
  ecommerce: { id: "ecommerce", diagnosisSignals: ["conversion_rate", "aov", "repeat_purchase_rate", "contribution_margin"], opportunityPatterns: ["improve conversion", "increase AOV", "recover abandoned carts"], defaultMissionKpis: ["revenue", "conversion_rate", "aov"], lowRiskActions: commonActions },
  saas: { id: "saas", diagnosisSignals: ["qualified_leads", "activation_rate", "retention", "churn"], opportunityPatterns: ["improve activation", "reduce churn", "increase expansion revenue"], defaultMissionKpis: ["activation_rate", "retention", "net_revenue_retention"], lowRiskActions: commonActions },
  professional_services: { id: "professional_services", diagnosisSignals: ["qualified_leads", "win_rate", "utilization", "gross_margin"], opportunityPatterns: ["improve proposal conversion", "increase qualified pipeline", "improve utilization"], defaultMissionKpis: ["qualified_leads", "win_rate", "gross_margin"], lowRiskActions: commonActions },
  local_services: { id: "local_services", diagnosisSignals: ["qualified_leads", "conversion_rate", "response_time", "reviews"], opportunityPatterns: ["improve local conversion", "reduce response time", "increase repeat business"], defaultMissionKpis: ["qualified_leads", "conversion_rate", "repeat_business"], lowRiskActions: commonActions },
  retail: { id: "retail", diagnosisSignals: ["revenue", "conversion_rate", "aov", "gross_margin"], opportunityPatterns: ["increase basket size", "improve conversion", "reactivate customers"], defaultMissionKpis: ["revenue", "conversion_rate", "aov"], lowRiskActions: commonActions },
  health_wellness: { id: "health_wellness", diagnosisSignals: ["bookings", "retention", "no_show_rate", "average_ticket"], opportunityPatterns: ["reduce no-shows", "increase retention", "improve service mix"], defaultMissionKpis: ["bookings", "retention", "average_ticket"], lowRiskActions: commonActions },
  generic_business: { id: "generic_business", diagnosisSignals: ["revenue", "conversion_rate", "retention", "gross_margin", "customer_value"], opportunityPatterns: ["improve conversion", "increase retention", "improve margin"], defaultMissionKpis: ["revenue", "conversion_rate", "gross_margin"], lowRiskActions: commonActions },
};

export function getVerticalPack(id: GrowthVerticalId): VerticalPack {
  return VERTICAL_PACKS[id];
}
