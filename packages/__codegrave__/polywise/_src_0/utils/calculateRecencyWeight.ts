import { RECENCY_HALF_LIFE_DAYS, RECENCY_MAX_WEIGHT, RECENCY_MIN_WEIGHT } from '../consts'

export default (updated_at?: string) => {
	if (!updated_at) return RECENCY_MAX_WEIGHT

	const timestamp = Date.parse(updated_at)

	if (!Number.isFinite(timestamp)) return RECENCY_MAX_WEIGHT

	const age_ms = Date.now() - timestamp

	if (age_ms <= 0) return RECENCY_MAX_WEIGHT

	const age_days = age_ms / (1000 * 60 * 60 * 24)
	const decay = Math.exp(-age_days / RECENCY_HALF_LIFE_DAYS)
	const weight = RECENCY_MIN_WEIGHT + (RECENCY_MAX_WEIGHT - RECENCY_MIN_WEIGHT) * decay

	return Math.min(RECENCY_MAX_WEIGHT, Math.max(RECENCY_MIN_WEIGHT, weight))
}
