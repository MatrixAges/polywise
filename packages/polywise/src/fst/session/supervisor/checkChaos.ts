import getChaosPrompt from '@core/consts/prompts/getChaosPrompt'
import { createChaosDetectionAgent } from '@core/fst/agents/supervisor'

import type { ChaosDetectionOutput } from '@core/fst/agents/supervisor'

export default async (recent_parts: Array<string>, model: any): Promise<boolean> => {
	if (recent_parts.length < 3) return false

	const agent = createChaosDetectionAgent(model)

	try {
		const res = await agent.generate({ prompt: getChaosPrompt(recent_parts) })
		const output = res.output as ChaosDetectionOutput

		return output?.is_chaos || false
	} catch {
		return false
	}
}
