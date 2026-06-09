import { listModels } from 'ai-sdk-provider-codex-app-server'

export default async () => {
	const result = await listModels()

	return result.models.map(item => ({
		id: item.id,
		model: item.model,
		displayName: item.displayName,
		description: item.description,
		hidden: false
	}))
}
