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

export const formatTriple = (input: string) => {
	return `<|im_start|>system
You are a triple extractor. Extract ONLY 1 most important triple from the input.
Strict JSON Output {"subject": "...", "predicate": "...", "object": "..."}

Example 1:
Input: 苹果公司发布了最新的iPhone 15系列手机。
Output: {"subject": "苹果公司","predicate": "发布了","object": "iPhone 15系列手机"}

Example 2:
Input: Artificial intelligence is transforming the global economy.
Output: {"subject": "Artificial intelligence","predicate": "is transforming","object": "the global economy"}
<|im_end|>
<|im_start|>user
Input: ${input}
<|im_end|>
<|im_start|>assistant
<think>
</think>
{"subject":`
}
