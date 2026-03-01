import { system } from '../consts'

import type { SequenceScore } from '../types'

export default (sequence_scores: Array<SequenceScore>) => {
	const selected_scores: Array<SequenceScore> = []

	for (const score_item of sequence_scores) {
		if (score_item.score < system.context_sequence_replay_min_score) continue

		selected_scores.push(score_item)
		if (selected_scores.length >= system.context_sequence_replay_limit) break
	}

	return selected_scores
}
