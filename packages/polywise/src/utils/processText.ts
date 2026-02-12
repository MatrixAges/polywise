import { RecursiveChunker } from '@chonkiejs/core'

export default async (text: string) => {
	const byte_size = Buffer.byteLength(text, 'utf8')

	if (byte_size <= 90000) {
		return [text]
	}

	const chunker = await RecursiveChunker.create({
		chunkSize: 1024,
		minCharactersPerChunk: 100
	})

	const final_chunks: Array<string> = []
	const safe_segment_size = 50 * 1024

	for (let i = 0; i < text.length; i += safe_segment_size) {
		const segment = text.slice(i, i + safe_segment_size)
		const chunks = await chunker.chunk(segment)

		final_chunks.push(...chunks.map(c => c.text))
	}

	return final_chunks
}
