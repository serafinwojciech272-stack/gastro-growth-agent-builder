import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import { assertAgentLoopInvariant } from "./agentLoopInvariant";
import { deriveLearningMemory, type LearningMemory } from "./learningEngine";
import { proposeNextMission, type NextMissionProposal } from "./nextMissionEngine";

export type AgentLoopResult = { learning: LearningMemory[]; nextMission: NextMissionProposal | null; completed: boolean };

export function runLearningCycle(mission: GrowthMission, outcomes: readonly GrowthOutcome[]): AgentLoopResult {
  assertAgentLoopInvariant(mission);
  const relevant = outcomes.filter((o) => o.missionId === mission.id);
  const learning = deriveLearningMemory(relevant);
  return { learning, nextMission: proposeNextMission(relevant, learning), completed: relevant.length > 0 };
}
