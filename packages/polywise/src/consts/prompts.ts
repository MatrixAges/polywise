export const getProactiveStatementPrompt = (
	content: string
) => `Assess if the input is a personal preference, user instruction, or a significant fact worth remembering for future sessions.
Respond with ONLY "YES" or "NO".

Input: "I like coffee."
Output: YES

Input: "Please remember my birthday is June 1st."
Output: YES

Input: "I am a software engineer."
Output: YES

Input: "Hello!"
Output: NO

Input: "Just checking in."
Output: NO

Input: "What time is it?"
Output: NO

Input: "The weather is nice."
Output: NO

Input: "${content}"
Output:`

export const getNextStepPrompt = (goal: string, history: string) => `Goal: "${goal}"
History:
${history}

Task: Determine the single next search query needed to deepen understanding.
If sufficient information is gathered, reply "DONE".
Reply with ONLY the query or "DONE".

Next Query:`

export const getClassifyPrompt = (
	existing_content: string,
	content: string
) => `Classify the relationship between the NEW info and EXISTING memory.
Options: DUPLICATE, UPDATE, NEW.

EXISTING: "I like Blue."
NEW: "I like Blue."
Relationship: DUPLICATE

EXISTING: "My name is John."
NEW: "I am John."
Relationship: DUPLICATE

EXISTING: "I live in London."
NEW: "I moved to Paris."
Relationship: UPDATE

EXISTING: "I like apples."
NEW: "The sky is blue."
Relationship: NEW

EXISTING: "${existing_content}"
NEW: "${content}"
Relationship:`
