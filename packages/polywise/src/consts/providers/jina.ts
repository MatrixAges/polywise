import type { PresetProvider } from '@core/types'

export default {
	name: 'jina',
	enabled: true,
	apiKey: '',
	models: [
		{
			enabled: true,
			id: 'jina-embeddings-v3',
			name: 'Jina Embeddings V3',
			type: 'embedding'
		},
		{
			enabled: true,
			id: 'jina-reranker-v3',
			name: 'Jina Reranker V3',
			type: 'rerank'
		}
	]
} as PresetProvider
