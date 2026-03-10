import { env } from '../env'

export default async (text: string) => {
	const res = await env.embedding_context.getEmbeddingFor(text)

	return res.vector as Array<number>
}
