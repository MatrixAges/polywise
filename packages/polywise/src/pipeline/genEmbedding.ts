import { config } from '@core/config'
import { getModel } from '@core/fst/provider'

let remote_embedding_runner: ((value: string) => Promise<Array<number>>) | null = null

export default async () => {
	if (remote_embedding_runner) return remote_embedding_runner

	if (!config.embedding_model) return null

	const { provider, model } = config.embedding_model

	console.log('embedding_model', config.embedding_model)

	const result = await getModel({
		provider,
		model,
		type: 'embedding'
	})

	remote_embedding_runner = result.run

	return remote_embedding_runner
}
