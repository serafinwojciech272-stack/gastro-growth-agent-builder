import type { GrowthDecisionContext, GrowthMission, GrowthOutcome } from "./growthTypes";
import { learnFromOutcomes, type LearningRecommendation } from "./learningEngine";

export type AgentCycle = {
  mission: GrowthMission;
  outcomes: GrowthOutcome[];
  learning: LearningRecommendation[];
  nextFocus: string[];
};

export function runLearningCycle(
  context: GrowthDecisionContext,
  mission: GrowthMission,
  outcomes: readonly GrowthOutcome[],
): AgentCycle {
  const learning = learnFromOutcomes(context, outcomes);
  const nextFocus = learning
    .filter((item) => item.recommendation !== "stop")
    .sort((a, b) => b.signal.confidence - a.signal.confidence)
    .map((item) => item.signal.kpi);

  return { mission, outcomes: [...outcomes], learning, nextFocus };
}
