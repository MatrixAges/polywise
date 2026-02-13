import type { ModelConfig } from './model'

export interface FstArgs {
	conversation_id: string
	session_id: string
	router_model: ModelConfig
	default_model: ModelConfig
	fallback_models?: Array<ModelConfig>
	cwd: string
}
