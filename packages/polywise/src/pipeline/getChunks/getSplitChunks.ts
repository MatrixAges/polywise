import { RecursiveChunker } from '@chonkiejs/core'

export default async (text: string) => {
	const chunker = await RecursiveChunker.create({
		chunkSize: 2048,
		minCharactersPerChunk: 200
	})

	const chunks = await chunker.chunk(text)

	return chunks.map(item => item.text)
}
