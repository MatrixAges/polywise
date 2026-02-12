## What is the mechanism called when the human brain reacts immediately to something, but simultaneously continues to recall and think, with emergent information appearing to supplement context? Are there papers supporting this?

This mechanism where the human brain produces an intuitive reaction followed by "emergent" background information to correct and supplement is commonly known in cognitive science as **Dual Process Theory**. At a deeper neural processing level, it reflects the hierarchical recursive process of **Predictive Coding**.

### 1. Core Mechanism Names

- **System 1 & System 2**: Concepts popularized by Nobel laureate Daniel Kahneman.
     - **Immediate Response (System 1)**: Fast, automatic, and often subconscious, relying on intuition and experience.
     - **Supplemental Context (System 2)**: Slow, controlled, and effortful, supplementing details and correcting initial impressions through logic and memory retrieval.

- **Predictive Coding and Generative Models**: From a neurobiological perspective, the brain is seen as a "prediction machine." When external stimuli do not match expectations (creating a "prediction error"), the brain invokes background knowledge and context (the "emergent information" you mentioned) from higher levels via feedback loops between neural layers to update internal models.

### 2. Authoritative Paper Support

Here are the most classic and representative academic studies in this field:

| Mechanism                 | Core Paper / Book                                                                                                           | Main Contribution                                                                                                                          |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Dual Process Theory**   | _Thinking, Fast and Slow_ (Kahneman, 2011)                                                                                  | Systematically elaborated the synergistic mechanism of fast intuition and slow thinking.                                                   |
| **Predictive Coding**     | [Predictive coding in the visual cortex](https://pmc.ncbi.nlm.nih.gov/articles/PMC6632880/) (Rao & Ballard, 1999)           | Proposed one of the earliest computational models of how the brain processes information hierarchically and uses context to predict input. |
| **Free Energy Principle** | [The free-energy principle: a rough guide to the brain?](https://pmc.ncbi.nlm.nih.gov/articles/PMC2666703/) (Friston, 2009) | Further unified perception, action, and memory, explaining how the brain integrates context by reducing "surprise."                        |
| **Cognitive Cycle**       | [The Timing of the Cognitive Cycle](https://pmc.ncbi.nlm.nih.gov/articles/PMC3081809/) (Madl et al., 2011)                  | Quantified the periodic process from sensory input to conscious broadcast (approx. 200-280ms) and final action.                            |

### 3. Process Description

When you see a blurry figure:

1.    **Immediate Response**: The Amygdala or System 1 quickly identifies it as a "potential threat."
2.    **Information Emergence**: As the Prefrontal Cortex intervenes, the brain extracts **context** like time and location from long-term memory (e.g., I'm at home, it's afternoon) and compares it with the predictive model.
3.    **Result**: Emergent information corrects the reaction—"That's just the coat hanging on the rack."

Are you interested in how these mechanisms are simulated in **Artificial Intelligence** (e.g., Transformer context windows)?

---

Artificial Intelligence (AI) primarily simulates this "react first, emerge/supplement context later" mechanism through **Attention Mechanisms** and **Reasoning Architectures**.

### 1. Core Technology for Simulating "Emergent Information": Attention Mechanism

In Large Language Models (LLMs), the Transformer architecture simulates this process through the [Self-Attention Mechanism](https://dev.to/qvfagundes/transformers-and-attention-how-llms-actually-process-text-3e3e):

- **Immediate Response**: When processing each word (Token), its initial vector representation (Embedding) reflects its most basic meaning (similar to an immediate reaction).
- **Contextual Emergence**: As information passes through multiple Transformer layers, each layer uses "Attention Heads" to retrieve relevant information from the entire context window. This is like the brain continuously grabbing clues from the "background" to supplement details while thinking.
- **Paper Support**: "Shared functional specialization in transformer-based language models and the human brain," published in _Nature Communications_, proves that Transformer circuit calculations have striking similarities to cortical activity during human language processing, especially in how they integrate context.

### 2. Simulating "Dual Process Theory": From System 1 to System 2

Current AI research is focused on moving models from "fast intuition" to "slow thinking":

- **System 1 (Intuition)**: Standard large models (like GPT-4o or DeepSeek-V3) usually predict the next word one at a time. This word-by-word generation is very close to human fast heuristic decision-making.
- **System 2 (Deep Thinking)**: Reasoning models like **OpenAI o1/o3** or **DeepSeek-R1** perform internal "search" and "error correction" through **Chain of Thought (CoT)** and reinforcement learning before giving a final answer. This process forces the model to "think" and supplement logical context before outputting, thereby correcting initial intuitive errors.
- **Paper Support**: [_From System 1 to System 2: A Survey of Reasoning Large Language Models_](https://strathprints.strath.ac.uk/94892/1/Zhang-etal-2025-From-system-1-to-system-2.pdf) systematically explores how to give AI human-like logical analysis and precise reasoning through structured search and reward models.

### 3. Engineering Implementation of Predictive Coding

AI models are also drawing from the brain's **Predictive Coding**:

- **Feedback Loops**: While traditional neural networks are primarily feed-forward, new generations are trying to add feedback mechanisms, allowing models to correct low-level sensory inputs based on high-level semantic predictions, much like the human brain.
- **Paper Support**: [_Brain-inspired Predictive Coding Improves the Performance of ANNs_](https://www.frontiersin.org/journals/computational-neuroscience/articles/10.3389/fncom.2022.1062678/full) explores how introducing this mechanism significantly enhances AI robustness in recognition tasks.
