import getSemanticChunks from './getSemanticChunks'
import getSplitChunks from './getSplitChunks'

export default async (text: string) => {
	const byte_size = Buffer.byteLength(text, 'utf8')
	const chunks = byte_size > 30 * 1024 ? await getSplitChunks(text) : await getSemanticChunks(text)

	return chunks.filter(item => item.trim())
}
