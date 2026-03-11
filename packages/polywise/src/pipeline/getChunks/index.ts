import getSemanticChunks from './getSemanticChunks'
import getSplitChunks from './getSplitChunks'

export default async (text: string) => {
	const byte_size = Buffer.byteLength(text, 'utf8')

	if (byte_size > 30 * 1024) return getSplitChunks(text)

	return getSemanticChunks(text)
}
