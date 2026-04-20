export default `---
name: skill-creator
description: Use this meta-skill when a conversation reveals a reusable workflow, repeated failure pattern, or missing recovery path that should be converted into a reusable local skill.
---

# skill-creator

## Trigger Conditions
- A complex task succeeded through multiple meaningful steps.
- The same or similar failure pattern appeared across sessions.
- An existing skill is relevant but missing steps, pitfalls, or verification logic.

## Numbered Steps
1. Summarize the workflow, failure pattern, and durable value without session-only details.
2. Search for similar local skills before drafting a new one.
3. Read the best matching skill to decide whether the outcome should create a new skill or update an existing one.
4. Convert the workflow into generalized trigger conditions, numbered steps, pitfalls, verification steps, and generalization notes.
5. Use a persuasive short description so the main agent can discover the skill under progressive disclosure.

## Pitfalls
- Do not hardcode one-off file paths, dates, IDs, or user-specific data.
- Do not create a new skill when an existing one only needs patching.
- Do not save noisy debugging fragments without a reusable recovery pattern.

## Verification Steps
1. Confirm the draft abstracts concrete details into reusable parameters.
2. Confirm the description clearly signals when the skill should be read.
3. Confirm the skill can be applied to another similar failure or workflow.

## Generalization Notes
- Replace project-specific identifiers with role-based or task-based parameters.
- Keep only the reusable decision path, not the original chat transcript.
`
