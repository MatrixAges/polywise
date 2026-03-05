import type { SpecialProvider } from '../types'

export default {
	name: 'ollama',
	enabled: true,
	base_url: 'http://localhost:11434/api',
	models: []
} as SpecialProvider
