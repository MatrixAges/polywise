import { streams } from './streams'

const MAX_PARTS = 20

const calculateSimilarity = (str1: string, str2: string): number => {
	if (!str1 || !str2) return 0

	const set1 = new Set(str1.split(' '))
	const set2 = new Set(str2.split(' '))

	const intersection = new Set([...set1].filter(x => set2.has(x)))
	const union = new Set([...set1, ...set2])

	return intersection.size / union.size
}

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
				info.chaos_detected = true

				return true
			}
		}
	}

	return false
}
