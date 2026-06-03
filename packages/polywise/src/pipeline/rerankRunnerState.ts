let remote_rerank_runner: ((query: string, values: Array<string>) => Promise<Array<number>>) | null = null

export const getRemoteRerankRunner = () => {
	return remote_rerank_runner
}

export const setRemoteRerankRunner = (
	runner: ((query: string, values: Array<string>) => Promise<Array<number>>) | null
) => {
	remote_rerank_runner = runner
}

export const resetRemoteRerankRunner = () => {
	remote_rerank_runner = null
}
