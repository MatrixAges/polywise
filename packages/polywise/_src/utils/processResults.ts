import dayjs from 'dayjs'

import type Pipeline from '../Pipeline'
import type { Memory, Metadata } from '../types'

export async function processResults(_query: string, memory: Array<Memory>, _pipeline: Pipeline) {
	const final_memory = memory.map(k => {
		const metadata = k.metadata as Metadata
		const is_empty_metadata = !metadata || Object.keys(metadata).length === 0

		return {
			memory_id: k.id,
			text: k.content,
			score: k.score,
			metadata: is_empty_metadata ? null : metadata,
			updated_at: k.updated_at ? dayjs(k.updated_at).format('YYYY-MM-DD HH:mm:ss') : ''
		}
	})

	return {
		memory: final_memory
	}
}
