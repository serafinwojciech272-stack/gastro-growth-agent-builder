# GGA Outcome Intelligence

## Objective

Turn every approved mission into structured evidence about what worked, for which business context, and with what confidence.

## Learning record

Each completed mission should retain:

1. vertical
2. business context
3. objective
4. diagnosis
5. selected opportunity
6. actions executed
7. baseline metrics
8. post-action metrics
9. measurement window
10. outcome classification
11. confidence
12. execution evidence

## Outcome classes

- `success`: positive measured impact with high confidence
- `partial_success`: positive impact with limited confidence
- `no_impact`: measured change is effectively zero
- `negative`: measured outcome deteriorated
- `insufficient_data`: evidence or confidence is too weak to classify

## Learning rules

Do not train routing or recommendations from unverified outcomes.

Prefer outcomes from comparable verticals and comparable business contexts.

Separate model quality from business outcome. A well-written response is not evidence of business success.

Reward repeatable outcomes rather than isolated wins.

Penalize negative outcomes and failed execution independently from poor model output.

## Future intelligence loop

`business context -> diagnosis -> opportunity -> mission -> action -> execution -> measurement -> outcome -> learning -> next recommendation`

This record becomes the foundation for vertical benchmarks and adaptive model selection.
