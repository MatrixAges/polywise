import { PERCEIVE_COMMAND } from './command'

export const formatNodeContent = (label: string, desc?: string) => {
	return desc || `Concept: ${label}`
}

export const formatSourceInfo = (source: string, stimulated: boolean, memoryStrength: number) => {
	return `[Source:${source}${stimulated ? ',Activated' : ''},Memory Strength:${memoryStrength.toFixed(2)}]`
}

export const formatPerceiveQuery = (query: string, insights: string) => {
	return `${query} [${PERCEIVE_COMMAND}: ${insights}]`
}
