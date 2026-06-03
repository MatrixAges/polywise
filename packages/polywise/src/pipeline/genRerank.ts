import getRemoteRerankModel from './getRemoteRerankModel'
import { getRemoteRerankRunner, resetRemoteRerankRunner, setRemoteRerankRunner } from './rerankRunnerState'

export default async () => {
	const remote_rerank_runner = getRemoteRerankRunner()

	if (remote_rerank_runner) return remote_rerank_runner

	const result = await getRemoteRerankModel()

	if (!result) return null

	setRemoteRerankRunner(result.run)

	return getRemoteRerankRunner()
}

export { resetRemoteRerankRunner }
