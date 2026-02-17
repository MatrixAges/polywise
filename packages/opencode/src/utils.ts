import type { Part } from '@opencode-ai/sdk'

export const getTextPart = (parts: Array<Part>) => {
	const targets = parts.filter((p): p is Part & { type: 'text'; text: string } => p.type === 'text')

	return targets.map(p => p.text).join('\n')
}
