import { homedir } from 'os'
import { resolve } from 'path'

export const app_path = resolve(`${homedir()}/.polywise`)
export const config_path = resolve(`${app_path}/config.json`)
export const providers_path = resolve(`${app_path}/providers.json`)
export const db_path = resolve(`${app_path}/db/app.db`)
export const vec_path = resolve(`${app_path}/db/vec.db`)
export const model_dir = resolve(`${app_path}/.models`)
export const logs_dir = resolve(`${app_path}/.logs`)

export const embedding_model = {
	uri: 'hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf',
	file_name: 'hf_Qwen_Qwen3-Embedding-0.6B-Q8_0.gguf'
}

export const rerank_model = {
	uri: 'hf:ggml-org/Qwen3-Reranker-0.6B-Q8_0-GGUF/qwen3-reranker-0.6b-q8_0.gguf',
	file_name: 'hf_ggml-org_qwen3-reranker-0.6b-q8_0.gguf'
}

export const gen_model = {
	uri: 'hf:unsloth/Qwen3.5-4B-GGUF/Qwen3.5-4B-UD-Q8_K_XL.gguf',
	file_name: 'hf_unsloth_Qwen3.5-4B-UD-Q8_K_XL.gguf'
}

export const global_agent_name = 'global'
