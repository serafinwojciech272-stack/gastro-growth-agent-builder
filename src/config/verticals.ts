export type GrowthVerticalId =
  | "restaurant"
  | "beauty"
  | "barber"
  | "hairdresser"
  | "fitness"
  | "hotel"
  | "home_services"
  | "construction"
  | "property_management"
  | "dental";

export type VerticalConfig = {
  id: GrowthVerticalId;
  productName: string;
  marketLabel: string;
  primaryGoal: string;
  coreKpis: readonly string[];
  missionExamples: readonly string[];
};

export const VERTICALS: Record<GrowthVerticalId, VerticalConfig> = {
  restaurant: {
    id: "restaurant",
    productName: "Gastro Growth Advisor",
    marketLabel: "Restaurants, pizzerias, bistros & cafés",
    primaryGoal: "Increase profitable demand and repeat business.",
    coreKpis: ["revenue", "reservations", "average_ticket", "reviews", "repeat_customers"],
    missionExamples: ["Increase weekday demand", "Improve review velocity", "Increase average ticket"],
  },
  beauty: {
    id: "beauty",
    productName: "Beauty Growth Advisor",
    marketLabel: "Beauty & aesthetics businesses",
    primaryGoal: "Increase bookings, retention and customer value.",
    coreKpis: ["bookings", "rebooking_rate", "retention", "reviews", "average_ticket"],
    missionExamples: ["Increase rebooking", "Fill low-demand slots", "Increase service upsells"],
  },
  barber: {
    id: "barber",
    productName: "Barber Growth Advisor",
    marketLabel: "Barbershops & men's grooming",
    primaryGoal: "Increase repeat bookings and customer lifetime value.",
    coreKpis: ["bookings", "rebooking_rate", "retention", "reviews", "average_ticket"],
    missionExamples: ["Increase rebooking", "Reactivate inactive clients", "Improve local reviews"],
  },
  hairdresser: {
    id: "hairdresser",
    productName: "Hairdresser Growth Advisor",
    marketLabel: "Hair salons & hairdressers",
    primaryGoal: "Increase bookings, retention and service value.",
    coreKpis: ["bookings", "rebooking_rate", "retention", "reviews", "average_ticket"],
    missionExamples: ["Increase rebooking", "Reduce empty slots", "Increase treatment upsells"],
  },
  fitness: {
    id: "fitness",
    productName: "Fitness Growth Advisor",
    marketLabel: "Gyms, studios & fitness businesses",
    primaryGoal: "Increase memberships, retention and utilization.",
    coreKpis: ["memberships", "retention", "attendance", "leads", "revenue_per_member"],
    missionExamples: ["Reduce churn", "Increase trial conversion", "Reactivate inactive members"],
  },
  hotel: {
    id: "hotel",
    productName: "Hotel Growth Advisor",
    marketLabel: "Hotels, resorts & hospitality",
    primaryGoal: "Increase profitable occupancy and direct demand.",
    coreKpis: ["occupancy", "adr", "revpar", "direct_bookings", "reviews"],
    missionExamples: ["Increase direct bookings", "Improve low-season demand", "Increase upsells"],
  },
  home_services: {
    id: "home_services",
    productName: "Home Services Growth Advisor",
    marketLabel: "Trades & local service businesses",
    primaryGoal: "Increase qualified leads, conversion and repeat demand.",
    coreKpis: ["qualified_leads", "quote_rate", "win_rate", "reviews", "repeat_business"],
    missionExamples: ["Increase qualified leads", "Improve quote follow-up", "Increase review volume"],
  },
  construction: {
    id: "construction",
    productName: "Construction Growth Advisor",
    marketLabel: "Construction & specialist contractors",
    primaryGoal: "Increase qualified opportunities and profitable projects.",
    coreKpis: ["qualified_leads", "quote_rate", "win_rate", "project_margin", "reviews"],
    missionExamples: ["Improve quote conversion", "Increase qualified enquiries", "Improve local visibility"],
  },
  property_management: {
    id: "property_management",
    productName: "Property Growth Advisor",
    marketLabel: "Property management & real estate operators",
    primaryGoal: "Increase qualified demand and portfolio performance.",
    coreKpis: ["qualified_leads", "occupancy", "response_time", "retention", "revenue"],
    missionExamples: ["Increase qualified enquiries", "Reduce response time", "Improve occupancy"],
  },
  dental: {
    id: "dental",
    productName: "Dental Growth Advisor",
    marketLabel: "Dental practices & clinics",
    primaryGoal: "Increase qualified bookings, retention and treatment value.",
    coreKpis: ["bookings", "no_show_rate", "retention", "reviews", "treatment_value"],
    missionExamples: ["Reduce no-shows", "Increase treatment acceptance", "Improve rebooking"],
  },
};

export const DEFAULT_VERTICAL: GrowthVerticalId = "restaurant";

export function getVerticalConfig(id?: string | null): VerticalConfig {
  return VERTICALS[(id as GrowthVerticalId) || DEFAULT_VERTICAL] ?? VERTICALS[DEFAULT_VERTICAL];
}
