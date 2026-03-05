import type { PresetProvider } from '../types'

export default {
	name: 'moonshot',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'kimi-k2.5',
			name: 'Kimi k2.5'
		}
	]
} as PresetProvider
