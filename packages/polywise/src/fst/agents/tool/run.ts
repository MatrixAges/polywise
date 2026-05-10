import createToolAgent from './agent'

import type { LanguageModel } from 'ai'
import type { infer as Infer, ZodTypeAny } from 'zod'

interface RunToolAgentArgs<TSchema extends ZodTypeAny> {
	instructions?: string
	max_steps?: number
	model: LanguageModel
	prompt: string
	schema: TSchema
}

export default async <TSchema extends ZodTypeAny>(args: RunToolAgentArgs<TSchema>) => {
	const { instructions, max_steps, model, prompt, schema } = args
	const agent = createToolAgent(model, { instructions, max_steps, schema })
	const res = await agent.generate({ prompt })

	return (res.output ?? null) as Infer<TSchema> | null
}
