# INVEST Checklist Reference

Use this checklist to evaluate whether a user story is ready for engineering implementation.

| Criterion | Evaluation Question | Pass / Fail Check |
|---|---|---|
| **Independent** | Can this story be developed, tested, and deployed without waiting for a parallel story? | [ ] No circular dependencies on concurrent tasks. |
| **Negotiable** | Does the story focus on user intent and business value rather than prescribing rigid code syntax? | [ ] Leaves implementation discovery to the engineering pair. |
| **Valuable** | Is the value to the end-user or business explicitly stated? | [ ] Clear "So that" clause delivering measurable benefit. |
| **Estimable** | Is the scope bounded clearly enough that effort and risks can be estimated? | [ ] Context and out-of-scope boundaries defined. |
| **Small** | Is the vertical slice small enough to implement in 1–2 days? | [ ] No multi-week epics; decomposed if necessary. |
| **Testable** | Are there concrete Gherkin scenarios with verifiable assertions? | [ ] Pass/fail criteria verifiable via automated tests. |
