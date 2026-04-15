import getRemoteEmbeddingModel from './getRemoteEmbeddingModel'

let remote_embedding_runner: ((value: string) => Promise<Array<number>>) | null = null

export default async () => {
	if (remote_embedding_runner) return remote_embedding_runner

	const result = await getRemoteEmbeddingModel()

	if (!result) return null

	remote_embedding_runner = result.run

	return remote_embedding_runner
}
