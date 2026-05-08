const token_unit_scale = 4
const cjk_regex = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/
const ascii_word_regex = /[A-Za-z0-9_]/

const getCharTokenUnits = (char: string) => {
	if (!char.trim()) return 0
	if (cjk_regex.test(char)) return token_unit_scale
	if (ascii_word_regex.test(char)) return 1

	return 2
}

const getTokenUnits = (text: string) => {
	let units = 0

	for (const char of Array.from(text)) {
		units += getCharTokenUnits(char)
	}

	return units
}

export const encode = (text: string) => {
	return Array.from(text)
}

export const decode = (tokens: Array<string>) => {
	return tokens.join('')
}

export const getTokenCount = (text: string) => {
	if (!text.trim()) return 0

	return Math.max(1, Math.ceil(getTokenUnits(text) / token_unit_scale))
}

export const splitTextByTokenBudget = (text: string, max_tokens: number, overlap_tokens: number) => {
	const chars = Array.from(text)

	if (chars.length === 0) return []

	const max_units = Math.max(token_unit_scale, max_tokens * token_unit_scale)
	const overlap_units = Math.max(0, overlap_tokens * token_unit_scale)
	const chunks: Array<string> = []

	let start_idx = 0

	while (start_idx < chars.length) {
		let end_idx = start_idx
		let current_units = 0

		while (end_idx < chars.length) {
			const next_units = getCharTokenUnits(chars[end_idx])

			if (current_units > 0 && current_units + next_units > max_units) {
				break
			}

			current_units += next_units
			end_idx++
		}

		if (end_idx <= start_idx) {
			end_idx = start_idx + 1
		}

		chunks.push(chars.slice(start_idx, end_idx).join(''))

		if (end_idx >= chars.length) break

		let rewind_units = 0
		let next_start_idx = end_idx

		while (next_start_idx > start_idx) {
			const prev_idx = next_start_idx - 1
			const prev_units = getCharTokenUnits(chars[prev_idx])

			if (rewind_units + prev_units > overlap_units) {
				break
			}

			rewind_units += prev_units
			next_start_idx = prev_idx
		}

		start_idx = next_start_idx === start_idx ? end_idx : next_start_idx
	}

	return chunks
}
