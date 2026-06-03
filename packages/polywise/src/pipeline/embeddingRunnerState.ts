let remote_embedding_runner: ((value: string) => Promise<Array<number>>) | null = null

export const getRemoteEmbeddingRunner = () => {
	return remote_embedding_runner
}

export const setRemoteEmbeddingRunner = (runner: ((value: string) => Promise<Array<number>>) | null) => {
	remote_embedding_runner = runner
}

export const resetRemoteEmbeddingRunner = () => {
	remote_embedding_runner = null
}
