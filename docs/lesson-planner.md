# Lesson planner tool

`lessonPlanner` is the chat agent's tool for planning a lesson, unit or project under a
pedagogical framework. It replaces the old one-shot `createPlanArtifact` tool. It asks
the questions it needs, then generates the plan in Markdown and saves it as a lesson
plan (`plan_artifact`, range `lesson`).

Code: `src/app/agents/lesson-planner/`

| File | Role |
| --- | --- |
| `schema.ts` | Zod schemas for profiles, drafts, plans and the tool input/output |
| `engine.ts` | Deterministic logic: option matching, questions, derived fields, phase distribution, validation, Markdown |
| `planner.ts` | `runLessonPlanner`: the actions `list_frameworks`, `update`, `generate`, `adjust` |
| `llm.ts` | The only LLM calls: extract fields, generate/adjust a plan, turn a school template into a profile |
| `registry.ts` | Loads and validates built-in and custom profiles |
| `tool.ts` | Binds the planner to the chat (model, database); the only file that imports the database |
| `profiles/*.json` | Built-in profiles (data only) |

## Using it

The model drives the loop, as described in the tool's description:

1. `update` with the teacher's words → `needs_info` (questions) or `ready_to_generate`.
2. Show `message_for_teacher` and the questions; pass back `draft` and `framework_id`.
3. `generate` once the status is `ready_to_generate` and the teacher agrees (or says "you decide", with `decide_missing: true`).
4. `complete` returns `markdown` and the saved plan id. `adjust` takes `current_plan` and `adjust_instruction`; a `framework_id` that differs switches framework.
5. A school template in `school_template_text` returns `needs_confirmation` with a profile. After the teacher confirms, pass it back as `custom_profile`.

Questions are at most five per round, required fields first. Optional fields are asked
once, and never when `decide_missing` is true. Answered fields are never asked again.

## Profiles

A profile declares: `id`, `name`, `description`, `version`, `default_language`, `hints`
(words that select it, e.g. "NEM"), `fields`, `derived_fields`, `sequence_models`,
`default_sequence`, `session_template`, `assessment`, `content_rules`,
`official_text_fields`, `output_sections`, `glossary`. The schema is in `schema.ts`
(`profileSchema`), and invalid profiles fail with the file name and the path of the problem.

Built-ins: `nem_mx`, `ubd`, `5e`, `pbl`, `direct_instruction`, `generic`.

### Add a framework with no code change

Drop a JSON file in `config/lesson-profiles/` (or the folder in `LESSON_PROFILES_DIR`).
It is validated when the tool loads. Ids must be unique across built-in and custom profiles.

### Add a built-in framework

Create `profiles/<id>.json` and add one import line to the list in `registry.ts`. Built-ins
are bundled as imports so they are type-checked and included in the server build.

## Running

Tests (the model is stubbed, no credentials needed):

```bash
npm test
```

Type check and lint:

```bash
npx tsc --noEmit
npm run lint
```

End to end with the real model (needs the AWS variables that the chat uses):

```bash
npx tsx scripts/lesson-planner-demo.ts
```

## Open items

- NEM details (phase mapping, methodology per campo, sequence phases) come from the
  spec and need review against the Plan de Estudio 2022.
- `ubd`, `5e`, `pbl` and `direct_instruction` are generic. `ubd`'s sequence uses five
  lesson phases for the Stage 3 learning plan: check that this matches how you teach it.
- The `generic` profile is in English; the model follows the teacher's language only
  through `output_language` or its own judgment.
- Plans are saved with `startDate` = `endDate` = today.
