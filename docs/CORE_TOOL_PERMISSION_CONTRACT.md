# Core Tool / Action Permission Contract

The Core AI Engine owns the decision boundary, not tool execution.

## Flow

`Mission Intent → Tool Action Request → Capability Registry → Policy Evaluation → allowed / requires_approval / blocked → existing Control/Execution Plane`

A tool must be registered before the Core can authorize an action. Unknown tools fail closed.

Each registered capability declares:

- `toolId`
- risk classification
- reversibility
- external side-effect flag

The request may further constrain risk, reversibility or side effects. The final policy evaluation is authoritative for the Core decision.

## Safety invariants

1. The Core never invokes a tool.
2. Unknown tools are blocked.
3. External side effects require approval under the default policy.
4. Irreversible actions require approval under the default policy.
5. Critical-risk actions are blocked by the default policy.
6. Runtime credentials, tenant checks and integration-specific authorization remain outside this contract and must be enforced by the execution adapter.
7. The contract does not create a second mission state machine.
