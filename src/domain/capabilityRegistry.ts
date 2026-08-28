import type { GrowthAction, GrowthMission, AutonomyLevel, ActionRisk } from "./growthTypes";
import { evaluateExecutionPolicy } from "./executionPolicy";

export type CapabilityContext = { mission: GrowthMission; action: GrowthAction };
export type CapabilityResult = { status: "completed" | "failed"; output?: Record<string, unknown>; error?: string };
export type CapabilityExecutor = (context: CapabilityContext) => Promise<CapabilityResult>;

export type Capability = {
  id: string;
  name: string;
  description: string;
  risk: ActionRisk;
  maxAutonomyLevel?: AutonomyLevel;
  health?: "healthy" | "degraded" | "offline";
  execute: CapabilityExecutor;
};

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, Capability>();

  register(capability: Capability): void {
    if (this.capabilities.has(capability.id)) throw new Error(`Capability already registered: ${capability.id}`);
    this.capabilities.set(capability.id, capability);
  }

  get(id: string): Capability | undefined { return this.capabilities.get(id); }
  list(): Capability[] { return [...this.capabilities.values()]; }

  async execute(id: string, context: CapabilityContext): Promise<CapabilityResult> {
    const capability = this.get(id);
    if (!capability) return { status: "failed", error: `Unknown capability: ${id}` };
    if (capability.health === "offline") return { status: "failed", error: `Capability is offline: ${id}` };
    if (capability.risk === "high") return { status: "failed", error: "High-risk capability requires human review" };
    if (capability.maxAutonomyLevel !== undefined && context.action.autonomyLevel > capability.maxAutonomyLevel) {
      return { status: "failed", error: "Action autonomy exceeds capability limit" };
    }
    const policy = evaluateExecutionPolicy(context.mission, context.action);
    if (!policy.allowed) return { status: "failed", error: policy.reason };
    return capability.execute(context);
  }
}
