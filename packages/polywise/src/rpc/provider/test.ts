import { all_providers } from '@core/consts/providers'
import { getModel } from '@core/fst/provider'
import { generateText } from 'ai'
import { array, boolean, object, record, string } from 'zod'

import getProviderRuntimeName from '../../utils/getProviderRuntimeName'
import { p } from '../../utils/trpc'

const input_type = object({
	name: string(),
	enabled: boolean(),
	apiKey: string().optional(),
	baseURL: string().optional(),
	headers: string().optional(),
	models: array(
		object({
			name: string(),
			id: string(),
			enabled: boolean(),
			type: string().optional(),
			fid: string().optional()
		})
	),
	custom_fields: record(string(), string()).optional()
})

const output_type = boolean()

interface ProviderTestInput {
	name: string
	enabled: boolean
	apiKey?: string
	baseURL?: string
	headers?: string
	models: Array<{
		name: string
		id: string
		enabled: boolean
		type?: string
		fid?: string
	}>
	custom_fields?: Record<string, string>
}

const parseHeaders = (value?: string) => {
	if (!value?.trim()) return undefined

	const parsed = JSON.parse(value) as Record<string, unknown>

	if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
		throw new Error('Provider headers must be a JSON object.')
	}

	return Object.fromEntries(
		Object.entries(parsed).map(([key, item]) => [key, typeof item === 'string' ? item : String(item)])
	)
}

const getTargetModel = (models: ProviderTestInput['models']) => {
	return (
		models.find(item => item.enabled && (!item.type || item.type === 'text')) ||
		models.find(item => item.enabled && item.type === 'embedding') ||
		models.find(item => item.enabled && item.type === 'rerank') ||
		models.find(item => item.enabled)
	)
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/provider/test',
			description: 'Test connectivity for one provider configuration by probing an enabled model.'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		try {
			const target_model = getTargetModel(input.models)

			if (!target_model) return false

			const provider_name = all_providers.some(item => item.name === input.name)
				? input.name
				: getProviderRuntimeName({
						provider_name: input.name,
						provider_item: input as ProviderTestInput & {
							custom_fields?: Record<string, string>
						},
						custom_provider_names: [input.name]
					})

			const options = {
				apiKey: input.apiKey,
				baseURL: input.baseURL,
				headers: parseHeaders(input.headers),
				...input.custom_fields
			}

			switch (target_model.type) {
				case 'embedding': {
					const model = await getModel({
						provider: provider_name,
						model: target_model.id,
						type: 'embedding',
						options
					})

					await model.run('ping')

					return true
				}
				case 'rerank': {
					const model = await getModel({
						provider: provider_name,
						model: target_model.id,
						type: 'rerank',
						options
					})

					await model.run('ping', ['pong'])

					return true
				}
				case 'image':
				case 'audio':
				case 'video':
					return false
				default: {
					const { model, provider_options } = await getModel({
						provider: provider_name,
						model: target_model.id,
						type: 'text',
						options,
						model_tool: false
					})

					await generateText({
						model,
						prompt: 'ping',
						maxOutputTokens: 1,
						providerOptions: provider_options,
						abortSignal: AbortSignal.timeout(15000)
					})

					return true
				}
			}
		} catch (error) {
			console.error('[provider.test] failed', error)

			return false
		}
	})
