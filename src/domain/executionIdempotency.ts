export type ExecutionKey = string;

export interface ExecutionLedger {
  has(key: ExecutionKey): Promise<boolean>;
  markStarted(key: ExecutionKey): Promise<void>;
  markCompleted(key: ExecutionKey): Promise<void>;
}

export class InMemoryExecutionLedger implements ExecutionLedger {
  private readonly started = new Set<ExecutionKey>();
  private readonly completed = new Set<ExecutionKey>();

  async has(key: ExecutionKey): Promise<boolean> {
    return this.completed.has(key);
  }

  async markStarted(key: ExecutionKey): Promise<void> {
    this.started.add(key);
  }

  async markCompleted(key: ExecutionKey): Promise<void> {
    this.completed.add(key);
  }
}

export function createExecutionKey(missionId: string, actionId: string): ExecutionKey {
  return `${missionId}:${actionId}`;
}
