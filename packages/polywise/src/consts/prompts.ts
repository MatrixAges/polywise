export const formatNodeContent = (label: string, desc?: string) => {
	return desc || `Concept: ${label}`
}

export const formatSourceInfo = (source: string, stimulated: boolean, memoryStrength: number) => {
	const strength = memoryStrength ?? 0
	return `[Source:${source}${stimulated ? ',Activated' : ''},Memory Strength:${strength.toFixed(2)}]`
}

export const formatLogEntry = (timestamp: string, input: any, output: any) => {
	return `${timestamp} [INPUT]\n${JSON.stringify(input)}\n\n${timestamp} [OUTPUT]\n${JSON.stringify(output)}\n`
}

export const formatPerceiveQuery = (query: string, insights: string) => {
	return `${query} [Perceive: ${insights}]`
}

export const formatRerankDocument = (source_info: string, content: string) => {
	return `${source_info}\n${content}`
}

export const formatKeywordsPrompt = (input: string) => {
	return `<|im_start|>system
You are a keyword extractor. Extract 3-10 most important keywords or short phrases from the input.
Strict JSON Output: A flat array of strings.

Example 1:
Input: 苹果公司发布了最新的iPhone 15系列手机。
Output: ["苹果公司", "发布了", "iPhone 15系列"]

Example 2:
Input: Artificial intelligence is transforming the global economy.
Output: ["Artificial intelligence", "global economy", "transforming"]
<|im_end|>
<|im_start|>user
Input: ${input}
<|im_end|>
<|im_start|>assistant
<think>
</think>
[`
}
