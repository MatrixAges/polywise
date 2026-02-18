import type Pipeline from '../Pipeline'
import type { Memory, Metadata } from '../types'

export async function processResults(_query: string, memory: Array<Memory>, _pipeline: Pipeline) {
	const final_memory = memory.map(k => ({
		memory_id: k.id,
		text: k.content,
		score: k.combinedScore,
		metadata: k.metadata as Metadata
	}))

	return {
		memory: final_memory
	}
}
