import { getRemoteEmbeddingRunner, resetRemoteEmbeddingRunner, setRemoteEmbeddingRunner } from './embeddingRunnerState'
import getRemoteEmbeddingModel from './getRemoteEmbeddingModel'

export default async () => {
	const remote_embedding_runner = getRemoteEmbeddingRunner()

	if (remote_embedding_runner) return remote_embedding_runner

	const result = await getRemoteEmbeddingModel()

	if (!result) return null

	setRemoteEmbeddingRunner(result.run)

	return getRemoteEmbeddingRunner()
}

export { resetRemoteEmbeddingRunner }
