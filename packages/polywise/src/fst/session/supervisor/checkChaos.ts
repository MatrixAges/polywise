import getChaosPrompt from '@core/consts/prompts/getChaosPrompt'
import { createChaosDetectionAgent } from '@core/fst/agents/supervisor'

import type { ChaosDetectionOutput } from '@core/fst/agents/supervisor'
import type Index from '../index'

const extractTextParts = (message: any): string => {
	if (!Array.isArray(message.parts)) return ''

	const text_parts: Array<string> = []

	for (const part of message.parts) {
		if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
			text_parts.push(part.text)
		}
	}

	return text_parts.join('\n')
}

const checkRepetitiveContent = (messages: Array<any>): boolean => {
	if (messages.length < 3) return false

	const recent_messages = messages.slice(-3)
	const text_contents = recent_messages.map(extractTextParts)

	for (let i = 0; i < text_contents.length - 1; i++) {
		for (let j = i + 1; j < text_contents.length; j++) {
			if (text_contents[i] && text_contents[j]) {
				const similarity = calculateSimilarity(text_contents[i], text_contents[j])
				if (similarity > 0.8) return true
			}
		}
	}

	return false
}

const calculateSimilarity = (str1: string, str2: string): number => {
	if (!str1 || !str2) return 0

	const set1 = new Set(str1.split(' '))
	const set2 = new Set(str2.split(' '))

	const intersection = new Set([...set1].filter(x => set2.has(x)))
	const union = new Set([...set1, ...set2])

	return intersection.size / union.size
}

export default async (s: Index): Promise<boolean> => {
	const messages = s.model_messages

	if (messages.length < 3) return false

	if (checkRepetitiveContent(messages)) return true

	const agent = createChaosDetectionAgent(s.model.model, s)

	try {
		const res = await agent.generate({ prompt: '' })
		const output = res.output as ChaosDetectionOutput

		return output?.is_chaos || false
	} catch {
		return false
	}
}
