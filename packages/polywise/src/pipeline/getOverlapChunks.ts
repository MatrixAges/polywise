import { pipeline } from '../consts'
import { decode, encode } from './token'

export default async (text: string) => {
	const tokens = encode(text)
	const chunks: Array<string> = []

	let start_idx = 0

	while (start_idx < tokens.length) {
		const end_idx = Math.min(start_idx + pipeline.max_tokens, tokens.length)

		chunks.push(decode(tokens.slice(start_idx, end_idx)))

		if (end_idx === tokens.length) break

		start_idx = end_idx - pipeline.overlap_size
	}

	return chunks
}
