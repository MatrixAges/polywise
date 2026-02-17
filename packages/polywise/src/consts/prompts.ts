export const getNextStepPrompt = (goal: string, history: string) => `Goal: "${goal}"
History:
${history}

Task: Determine the single next search query needed to deepen understanding.
If sufficient information is gathered, reply "DONE".
Reply with ONLY the query or "DONE".

Next Query:`
