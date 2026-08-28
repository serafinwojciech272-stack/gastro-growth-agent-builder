import type { CapabilityContext, CapabilityResult } from "./capabilityRegistry";

export type CapabilityHealth = "healthy" | "degraded" | "offline";
export type CapabilityAdapter = { id: string; capabilityId: string; version: string; health: CapabilityHealth; execute(context: CapabilityContext): Promise<CapabilityResult> };

export function validateCapabilityAdapter(adapter: CapabilityAdapter): void {
  if (!adapter.id || !adapter.capabilityId || !adapter.version) throw new Error("Invalid capability adapter contract");
  if (adapter.health === "offline") throw new Error(`Capability adapter offline: ${adapter.id}`);
}
