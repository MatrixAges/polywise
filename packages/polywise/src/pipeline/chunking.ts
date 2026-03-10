import { RecursiveChunker } from '@chonkiejs/core'

import getChunks from './getChunks'

export default async (text: string) => {
	const byte_size = Buffer.byteLength(text, 'utf8')

	if (byte_size > 30 * 1024) {
		const chunker = await RecursiveChunker.create({
			chunkSize: 2048,
			minCharactersPerChunk: 200
		})
		return chunker.chunk(text)
	}

	return getChunks(text)
}
