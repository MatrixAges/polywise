import { z } from 'zod'

export const PriceSchema = z.object({
	input: z.number(),
	output: z.number()
})

export const ProviderSchema = z.object({
	npm: z.string().optional(),
	options: z
		.object({
			baseURL: z.string().optional(),
			apiKey: z.string().optional()
		})
		.catchall(z.unknown()),
	models: z.record(
		z.string(),
		z.object({
			name: z.string(),
			enabled: z.boolean().optional(),
			price: PriceSchema.optional()
		})
	),
	enabled: z.boolean().optional()
})

export const ConfigSchema = z.object({
	$schema: z.string().optional(),
	enable_cost: z.boolean().optional(),
	provider: z.record(z.string(), ProviderSchema),
	model: z.string()
})

export type Config = z.infer<typeof ConfigSchema>
