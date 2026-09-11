export type GrowthVerticalId =
  | "restaurant" | "beauty" | "barber" | "hairdresser" | "fitness" | "hotel" | "home_services" | "construction" | "property_management" | "dental"
  | "ecommerce" | "saas" | "professional_services" | "local_services" | "retail" | "health_wellness" | "generic_business";

export type VerticalConfig = {
  id: GrowthVerticalId;
  productName: string;
  marketLabel: string;
  primaryGoal: string;
  coreKpis: readonly string[];
  missionExamples: readonly string[];
};

export const VERTICALS: Record<GrowthVerticalId, VerticalConfig> = {
  restaurant: { id: "restaurant", productName: "GA", marketLabel: "Restaurants, pizzerias, bistros & cafés", primaryGoal: "Increase profitable demand and repeat business.", coreKpis: ["revenue", "reservations", "average_ticket", "reviews", "repeat_customers"], missionExamples: ["Increase weekday demand", "Improve review velocity", "Increase average ticket"] },
  beauty: { id: "beauty", productName: "GA", marketLabel: "Beauty & aesthetics businesses", primaryGoal: "Increase bookings, retention and customer value.", coreKpis: ["bookings", "rebooking_rate", "retention", "reviews", "average_ticket"], missionExamples: ["Increase rebooking", "Fill low-demand slots", "Increase service upsells"] },
  barber: { id: "barber", productName: "GA", marketLabel: "Barbershops & men's grooming", primaryGoal: "Increase repeat bookings and customer lifetime value.", coreKpis: ["bookings", "rebooking_rate", "retention", "reviews", "average_ticket"], missionExamples: ["Increase rebooking", "Reactivate inactive clients", "Improve local reviews"] },
  hairdresser: { id: "hairdresser", productName: "GA", marketLabel: "Hair salons & hairdressers", primaryGoal: "Increase bookings, retention and service value.", coreKpis: ["bookings", "rebooking_rate", "retention", "reviews", "average_ticket"], missionExamples: ["Increase rebooking", "Reduce empty slots", "Increase treatment upsells"] },
  fitness: { id: "fitness", productName: "GA", marketLabel: "Gyms, studios & fitness businesses", primaryGoal: "Increase memberships, retention and utilization.", coreKpis: ["memberships", "retention", "attendance", "leads", "revenue_per_member"], missionExamples: ["Reduce churn", "Increase trial conversion", "Reactivate inactive members"] },
  hotel: { id: "hotel", productName: "GA", marketLabel: "Hotels, resorts & hospitality", primaryGoal: "Increase profitable occupancy and direct demand.", coreKpis: ["occupancy", "adr", "revpar", "direct_bookings", "reviews"], missionExamples: ["Increase direct bookings", "Improve low-season demand", "Increase upsells"] },
  home_services: { id: "home_services", productName: "GA", marketLabel: "Trades & local service businesses", primaryGoal: "Increase qualified leads, conversion and repeat demand.", coreKpis: ["qualified_leads", "quote_rate", "win_rate", "reviews", "repeat_business"], missionExamples: ["Increase qualified leads", "Improve quote follow-up", "Increase review volume"] },
  construction: { id: "construction", productName: "GA", marketLabel: "Construction & specialist contractors", primaryGoal: "Increase qualified opportunities and profitable projects.", coreKpis: ["qualified_leads", "quote_rate", "win_rate", "project_margin", "reviews"], missionExamples: ["Improve quote conversion", "Increase qualified enquiries", "Improve local visibility"] },
  property_management: { id: "property_management", productName: "GA", marketLabel: "Property management & real estate operators", primaryGoal: "Increase qualified demand and portfolio performance.", coreKpis: ["qualified_leads", "occupancy", "response_time", "retention", "revenue"], missionExamples: ["Increase qualified enquiries", "Reduce response time", "Improve occupancy"] },
  dental: { id: "dental", productName: "GA", marketLabel: "Dental practices & clinics", primaryGoal: "Increase qualified bookings, retention and treatment value.", coreKpis: ["bookings", "no_show_rate", "retention", "reviews", "treatment_value"], missionExamples: ["Reduce no-shows", "Increase treatment acceptance", "Improve rebooking"] },
  ecommerce: { id: "ecommerce", productName: "GA", marketLabel: "E-commerce & direct-to-consumer", primaryGoal: "Increase profitable conversion, repeat purchase and contribution margin.", coreKpis: ["revenue", "conversion_rate", "aov", "repeat_purchase_rate", "contribution_margin"], missionExamples: ["Improve conversion", "Increase AOV", "Recover abandoned carts"] },
  saas: { id: "saas", productName: "GA", marketLabel: "Software & subscription businesses", primaryGoal: "Increase qualified acquisition, activation, retention and expansion.", coreKpis: ["qualified_leads", "activation_rate", "retention", "churn", "net_revenue_retention"], missionExamples: ["Improve activation", "Reduce churn", "Increase expansion revenue"] },
  professional_services: { id: "professional_services", productName: "GA", marketLabel: "Consulting, agencies & professional services", primaryGoal: "Increase qualified pipeline, win rate and profitable client value.", coreKpis: ["qualified_leads", "win_rate", "utilization", "average_contract_value", "gross_margin"], missionExamples: ["Improve proposal conversion", "Increase qualified pipeline", "Improve utilization"] },
  local_services: { id: "local_services", productName: "GA", marketLabel: "Local service businesses", primaryGoal: "Increase qualified local demand, conversion and repeat business.", coreKpis: ["qualified_leads", "conversion_rate", "response_time", "reviews", "repeat_business"], missionExamples: ["Improve local conversion", "Reduce response time", "Increase repeat business"] },
  retail: { id: "retail", productName: "GA", marketLabel: "Retail & multi-channel commerce", primaryGoal: "Increase profitable traffic, conversion, basket size and retention.", coreKpis: ["revenue", "conversion_rate", "aov", "gross_margin", "repeat_customers"], missionExamples: ["Increase basket size", "Improve conversion", "Reactivate customers"] },
  health_wellness: { id: "health_wellness", productName: "GA", marketLabel: "Health, wellness & care businesses", primaryGoal: "Increase appropriate demand, retention and service value.", coreKpis: ["bookings", "retention", "no_show_rate", "average_ticket", "reviews"], missionExamples: ["Reduce no-shows", "Increase retention", "Improve service mix"] },
  generic_business: { id: "generic_business", productName: "GA", marketLabel: "Any growth-oriented business", primaryGoal: "Increase profitable growth while improving decision quality and execution discipline.", coreKpis: ["revenue", "conversion_rate", "retention", "gross_margin", "customer_value"], missionExamples: ["Improve conversion", "Increase retention", "Improve margin"] },
};

export const DEFAULT_VERTICAL: GrowthVerticalId = "generic_business";
export function getVerticalConfig(id?: string | null): VerticalConfig { return VERTICALS[(id as GrowthVerticalId) || DEFAULT_VERTICAL] ?? VERTICALS[DEFAULT_VERTICAL]; }
