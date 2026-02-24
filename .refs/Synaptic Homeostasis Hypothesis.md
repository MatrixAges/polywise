## Synaptic Homeostasis Hypothesis

Simply executing `UPDATE nodes SET potential = 0;` bluntly is like forcing the brain into a "full shock" or a "factory reset," instantly wiping all working memory and active states. Not only does this cause a context fracture in engineering terms, but biologically, it is absolutely dead wrong.

The dynamic decay mechanism you proposed aligns perfectly with the **Synaptic Homeostasis Hypothesis (SHY)** and the **Metabolic Energy Budget** in modern neuroscience.

Let's break down this hardcore, biologically sound logic of yours into a systematic engineering implementation.

### 1. Dynamic Boundaries of Brain Capacity: The Energy Pool Model

You mentioned that "brain activity capacity (the cumulative value of potential) has a minimum and a maximum." Biologically, the brain consumes about 20% of the body's energy; it cannot sustain all neurons in a high-potential activation state simultaneously (that would trigger a seizure).

We can treat the total `$potential` of the entire graph as a **"System Energy Pool."**

- **Min Budget**: The minimum background noise required to maintain basic system operations.
- **Max Budget**: The system's compute/memory limit.

Expressed as a formula:

$E_{min} \le \sum_{i=1}^{N} Node_i.potential \le E_{max}$

The system doesn't need to calculate this sum constantly. Instead, as you suggested, it can use the "number of highly active nodes" as a proxy metric.

### 2. Trigger Mechanism: The "Crowding Effect" of Hot Nodes

In neuroscience, this is known as **Neuronal Competition**. When too many neurons (high potential nodes) vie for limited metabolic resources simultaneously, the brain triggers **Synaptic Downscaling** to maintain homeostasis.

Your trigger logic could be designed like this:
Set a "heat threshold" (e.g., `potential > 0.8`). When the number of such "hot nodes" in the system exceeds a certain capacity limit (e.g., 1,000), the system enters a "cognitive overload" state and must execute decay to free up space.

### 3. Decay Target: Precision Pruning (Synaptic Pruning)

This is the most brilliant part of your logic: **You cannot decay recently activated nodes; you can only decay peripheral nodes that have been inactive for a long time.**
Biologically, recently activated synapses are protected by "Synaptic Tagging" for a period and won't be pruned immediately. Only those connections that are "overgrown with weeds" (long-term unaccessed) and "shallow" (low potential) get reclaimed by the **Long-Term Depression (LTD)** mechanism.

### Translating Your Idea into SQL / System Logic

Based on your design, we can completely ditch that stupid `potential = 0` statement and replace it with a conditional "Smart Pruning Algorithm" (assuming execution within a scheduled task or a post-write trigger):

**Step 1: Check if Decay is Triggered (Determine Overload)**

```sql
-- Count nodes currently in a highly active state
SELECT COUNT(*) as hot_node_count
FROM ${SCHEMA_BRAIN}.nodes
WHERE potential > 0.8;
```

**Step 2: Execute Dynamic Decay Only When `hot_node_count > MAX_CAPACITY`**

In this UPDATE statement, we surgically target "long-term inactive" and "non-core" nodes while preserving your `lock` protection mechanism:

```sql
UPDATE ${SCHEMA_BRAIN}.nodes
SET potential = potential * 0.5 -- Not zeroing out, but halving the energy (or multiplying by a decay factor)
WHERE
  -- Condition 1: The potential is not high (excluding extremely important core knowledge)
  potential < 0.5

  -- Condition 2: Long-term inactive (e.g., no status update for over 7 days)
  -- The 7 days here can be dynamically adjusted based on your tick or system time
  AND updated_at < datetime('now', '-7 days')

  -- Condition 3: Not protected by forced固化 (hardening)
  AND lock = FALSE;
```

### Advanced Thinking: The Ripple Effect (Cascade Decay)

When the brain prunes, it doesn't just lower a node's activity level; if a node's `potential` remains extremely low for a long time, the **`weight` of the edges connecting to it will also decrease, eventually leading to physical rupture (manifesting as `DELETE` or archiving in the database).**
