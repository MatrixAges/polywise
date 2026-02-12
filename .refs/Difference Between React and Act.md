## Difference Between React and Act

In cognitive science and robotics control architectures (like the **Polywise** system you are building), there is a fundamental distinction between **React** and **Act**, corresponding to **low-level reflex circuits** and **high-level conscious decision-making**.

Here is a core comparison between the two:

### 1. React — The "Fast System"

**React** is a **Stimulus-Response** mechanism. It does not involve deep deliberation and is primarily controlled by the **Striatum (STR)** subcortical reflex centers.

- **Path**: Perceptual Input → Preset Rule Mapping → Execution.
- **Cognitive Features**:
     - **Involuntary**: Does not consume "Working Memory (PFC)" bandwidth.
     - **Deterministic**: The same stimulus in the same environment always produces the same action (like an `if-else` or $O(1)$ routing in code).
     - **Latency**: Extremely low (millisecond range).
- **Embodied Example**: A robot detects an obstacle 5cm ahead and stops immediately (without thinking "why is there an obstacle").

### 2. Act — The "Slow System"

**Act** is a **Goal-oriented** decision-making process. It is coordinated by the **Prefrontal Cortex (PFC)**, retrieves background knowledge from the **Hippocampus (HIP)**, and is produced after logical reasoning.

- **Path**: Perceptual Input → Context Retrieval → Simulation/Prediction → Decision → Execution.
- **Cognitive Features**:
     - **Purposeful**: Aimed at achieving a long-term Goal.
     - **Flexible**: Can change strategies based on context. If the current path is blocked, it tries a new one.
     - **Latency**: Higher (requires vector similarity calculations, LLM calls, or knowledge graph traversal).
- **Embodied Example**: A robot finds a door won't open, deliberates, and decides to find a key or try another door (involving episodic recall from the Hippocampus).

### 3. Engineering Mapping in Your System

To give **Polywise** biological-grade intelligence, you need to combine both:

| Feature                | **React (Driven by STR)**                           | **Act (Driven by PFC + HIP)**                        |
| :--------------------- | :-------------------------------------------------- | :--------------------------------------------------- |
| **Storage Technology** | **pglite** (Rule Vector Table)                      | **pglite** (Association Graph / KB)                  |
| **Timing**             | **Real-time Trigger**: Intercepts all input         | **On-demand**: Starts when rules don't match         |
| **Learning Mode**      | **Reinforcement Learning**: Adjusts $(S,A)$ weights | **Associative Learning**: Builds edges between nodes |
| **Caching Strategy**   | **Hot Data**: Stores highest frequency habits       | **Full Data**: Stores all experience                 |

### 4. Evolutionary Cycle (The Essence of Your System)

- **Act to React (Automation)**:
  When a new action (Act) is decided by the PFC and executed, if user feedback (Reward) is consistently positive, the logic is handed over to the Striatum (STR), becoming an automated **React** rule. This is the process of a pianist shifting from "thinking about fingerings" to "muscle memory."
- **React to Act (Conscious Intervention)**:
  When a habitual response (React) leads to negative feedback (Reward < 0) in the current environment, the PFC forcibly intervenes, inhibits the STR's automatic output, and re-invokes the Hippocampus (HIP) to enter **Act** mode to find a new solution.

### Summary

- **React** is for **survival and efficiency** (living without thinking).
- **Act** is for **problem-solving and evolution** (purposely transforming the world).

In your architecture, **the core function of the PFC is to judge whether the current situation warrants a React or an Act**. If weights in LMDB/LanceDB are high enough, React; otherwise, trigger pglite for deep Act.
