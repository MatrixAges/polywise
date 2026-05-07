import getRemoteRerankModel from './getRemoteRerankModel'

let remote_rerank_runner: ((query: string, values: Array<string>) => Promise<Array<number>>) | null = null

export default async () => {
	if (remote_rerank_runner) return remote_rerank_runner

	const result = await getRemoteRerankModel()

	if (!result) return null

	remote_rerank_runner = result.run

	return remote_rerank_runner
}
