import type { PresetProvider } from '../types'

export default {
	name: 'minimax',
	enabled: true,
	api_key: '',
	models: [
		{
			enabled: true,
			id: 'minimax-m2.5',
			name: 'MiniMax M2.5'
		},
		{
			enabled: true,
			id: 'minimax-m2.5-highspeed',
			name: 'MiniMax M2.5 highspeed'
		}
	]
} as PresetProvider
