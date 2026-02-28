import type { SequenceScore } from '../types'

export default (selected_scores: Array<SequenceScore>) => {
	let max_score = 0

	for (const selected_item of selected_scores) {
		if (selected_item.score > max_score) {
			max_score = selected_item.score
		}
	}

	return max_score
}
