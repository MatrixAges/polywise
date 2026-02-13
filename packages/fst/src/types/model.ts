export interface ModelConfig {
	id: string
	provider: string
	model: string
	api_key?: string
	base_url?: string
	max_cost?: number
	price_per_token?: {
		prompt: number
		completion: number
	}
}
