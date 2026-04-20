import calculateSimilarity from './calculateSimilarity'
import { streams } from './streams'

const MAX_PARTS = 20
const MIN_TEXT_LENGTH = 24
const MIN_BLOCK_LENGTH = 80
const MAX_PENDING_LENGTH = 240
const SIMILARITY_THRESHOLD = 0.95

const shouldSkipText = (text: string) => {
	const trimmed_text = text.trim()

	if (!trimmed_text) return true

	if (trimmed_text.length < MIN_TEXT_LENGTH) return true

	if (/^`{1,3}$/.test(trimmed_text)) return true

	if (/^[\-*=#>\d.\s]+$/.test(trimmed_text)) return true

	return false
}

const shouldFlushBlock = (text: string) => {
	if (text.length >= MAX_PENDING_LENGTH) return true

	if (text.length >= MIN_BLOCK_LENGTH && /[\n。！？.!?]$/.test(text.trim())) return true

	return false
}

export default (session_id: string, text: string) => {
	const info = streams.get(session_id)

	if (!info) return false

	if (shouldSkipText(text)) return false

	info.pending_text += text

	if (!shouldFlushBlock(info.pending_text)) return false

	const normalized_text = info.pending_text.trim()

	info.pending_text = ''

	if (normalized_text.length < MIN_BLOCK_LENGTH) return false

	info.recent_parts.push(normalized_text)

	if (info.recent_parts.length > MAX_PARTS) {
		info.recent_parts = info.recent_parts.slice(-MAX_PARTS)
	}

	if (info.recent_parts.length < 4) return false

	const recent = info.recent_parts.slice(-4)
	let similar_pair_count = 0

	for (let i = 0; i < recent.length - 1; i++) {
		for (let j = i + 1; j < recent.length; j++) {
			if (calculateSimilarity(recent[i], recent[j]) >= SIMILARITY_THRESHOLD) {
				similar_pair_count++
			}
		}
	}

	if (similar_pair_count >= 3) {
		info.chaos_detected = true

		return true
	}

	info.chaos_detected = false

	return false
}
