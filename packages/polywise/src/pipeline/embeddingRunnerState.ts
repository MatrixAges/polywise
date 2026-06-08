let remote_embedding_runner: ((value: string) => Promise<Array<number>>) | null = null
let remote_embedding_runner_promise: Promise<((value: string) => Promise<Array<number>>) | null> | null = null

export const getRemoteEmbeddingRunner = () => {
	return remote_embedding_runner
}

export const setRemoteEmbeddingRunner = (runner: ((value: string) => Promise<Array<number>>) | null) => {
	remote_embedding_runner = runner
}

export const getRemoteEmbeddingRunnerPromise = () => {
	return remote_embedding_runner_promise
}

export const setRemoteEmbeddingRunnerPromise = (
	runner_promise: Promise<((value: string) => Promise<Array<number>>) | null> | null
) => {
	remote_embedding_runner_promise = runner_promise
}

export const resetRemoteEmbeddingRunner = () => {
	remote_embedding_runner = null
	remote_embedding_runner_promise = null
}
