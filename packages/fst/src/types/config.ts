import { z } from 'zod'

export const PriceSchema = z.object({
	input: z.number(),
	output: z.number()
})

export const ProviderConfigSchema = z.object({
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

export const AppConfigSchema = z.object({
	$schema: z.string().optional(),
	enable_cost: z.boolean().optional(),
	provider: z.record(z.string(), ProviderConfigSchema),
	model: z.string()
})

export type AppConfig = z.infer<typeof AppConfigSchema>
