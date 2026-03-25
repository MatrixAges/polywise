import type { SpecialProvider } from '@core/types'

export default {
	name: 'ollama',
	enabled: true,
	baseURL: 'http://localhost:11434/api',
	models: []
} as SpecialProvider
