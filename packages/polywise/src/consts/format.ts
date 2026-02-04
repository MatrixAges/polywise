import { PERCEIVE_COMMAND } from './command'

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
	return `${query} [${PERCEIVE_COMMAND}: ${insights}]`
}
