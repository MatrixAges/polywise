import calculateSimilarity from './calculateSimilarity'
import { streams } from './streams'

const MAX_PARTS = 20

export default (session_id: string, text: string): boolean => {
	const info = streams.get(session_id)

	if (!info) return false

	info.recent_parts.push(text)

	if (info.recent_parts.length > MAX_PARTS) {
		info.recent_parts = info.recent_parts.slice(-MAX_PARTS)
	}

	if (info.recent_parts.length < 3) return false

	const recent = info.recent_parts.slice(-3)

	for (let i = 0; i < recent.length - 1; i++) {
		for (let j = i + 1; j < recent.length; j++) {
			if (calculateSimilarity(recent[i], recent[j]) > 0.8) {
				console.log(
					`[chaos] similarity detected: ${calculateSimilarity(recent[i], recent[j]).toFixed(2)}`
				)
				info.chaos_detected = true

				return true
			}
		}
	}

	return false
}
