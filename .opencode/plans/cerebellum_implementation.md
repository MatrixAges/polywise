# Cerebellum Implementation Plan: Intelligent Memory Management

Introduce a small model (`onnx-community/Qwen3-0.6B-ONNX`) to handle semantic decisions for long-term memory, replacing hardcoded similarity heuristics.

## 1. Infrastructure Setup

### Constants & Configuration

- **File**: `packages/polywise/src/consts/model.ts`
     - Define `DEFAULT_DECISION_MODEL = 'onnx-community/Qwen3-0.6B-ONNX'`.
     - Define `DEFAULT_DECISION_CONFIG` using the decision model.
- **File**: `packages/polywise/src/consts/performance.ts`
     - Deprecate `PROACTIVE_EXAMPLES` and `PROACTIVE_SIMILARITY_THRESHOLD`.

### Types

- **File**: `packages/polywise/src/types/args.ts`
     - Add `DecisionConfig` interface (supports `local` and `custom`).
     - Add `DecisionOptions` for token limits/temperature.
     - Update `PolywiseArgs` and `PipelineArgs` to include `decision_config` and `decision_concurrency`.

## 2. Pipeline Enhancement (`Pipeline.ts`)

- **State**:
     - Add `decision_pipeline`, `decision_promise`, `decision_queue`.
- **Loading**:
     - Implement `loadDecisionModel()` using `pipeline('text-generation', model, { dtype: 'q8' })`.
- **Inference**:
     - Implement `decide(prompt: string, options?: DecisionOptions)`:
          - Wraps text generation in a concurrency queue.
          - Includes standard prompt wrapping (e.g., `<|im_start|>system\n...<|im_end|>`).
          - Returns the generated text or a boolean based on "YES/NO" parsing.

## 3. Intelligent Memory Logic

### Proactive Filtering (`Polywise.ts`)

- **Refactor `isProactiveStatement(content: string)`**:
     - Remove embedding similarity logic.
     - Use `pipeline.decide` with a system prompt:
          ```text
          Assess if the following text is a personal preference, a user instruction, or a significant fact worth remembering for long-term context.
          Answer ONLY "YES" or "NO".
          Text: "{content}"
          ```

### Intelligent Deduplication (`Memory.ts`)

- **Refactor `saveLongTerm(content: string, args: FiltersArgs)`**:
     - **Step 1: Vector Candidate Retrieval**: Search with a relaxed threshold (e.g., 0.8).
     - **Step 2: Cerebellum Analysis**: If candidates exist, prompt the model:
          ```text
          Determine the relationship between the NEW info and EXISTING memory.
          NEW: "{content}"
          EXISTING: "{existing_content}"
          Choices:
          - DUPLICATE: Same meaning.
          - UPDATE: New info modifies or adds detail to existing.
          - NEW: Different topic.
          Answer ONLY with one choice.
          ```
     - **Step 3: Action**:
          - `DUPLICATE`: Only update frequency/last_accessed.
          - `UPDATE`: Update the record content with the newer version (or merge if possible).
          - `NEW`: Insert as new record.

## 4. Verification

- **Unit Test**: `packages/polywise/test/cerebellum.spec.ts`
     - Test "Proactive" detection with complex sentences.
     - Test "Update" vs "Duplicate" vs "New" detection.
- **Performance**: Monitor model loading time and inference latency (0.6B model should be fast enough on local CPU).

## 5. Documentation

- Update `agentmap.md` to reflect new architecture components.
