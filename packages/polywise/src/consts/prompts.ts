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

export const formatTriple = (text: string) => {
	return `<|im_start|>system
You are a knowledge extraction assistant. Your task is to extract subject-predicate-object triples from the given text. Return ONLY a JSON array of triples in this exact format:
[{"subject": "...", "predicate": "...", "object": "..."}]
If no meaningful triples can be extracted, return an empty array [].
<|im_end|>
<|im_start|>user
Extract triples from this text:
${text}
<|im_end|>
<|im_start|>assistant`
}
