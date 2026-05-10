import os from 'os'
import path from 'path'

export const app_path = path.resolve(`${os.homedir()}/.polywise`)
export const config_path = path.resolve(`${app_path}/config.json`)
export const providers_path = path.resolve(`${app_path}/providers.json`)
export const db_path = path.resolve(`${app_path}/db/app.db`)
export const vec_path = path.resolve(`${app_path}/db/vec.db`)
export const model_dir = path.resolve(`${app_path}/.models`)
export const logs_dir = path.resolve(`${app_path}/.logs`)
export const cron_dir = path.resolve(`${app_path}/cron`)
export const cron_path = path.resolve(`${app_path}/cron.json`)
export const agents_path = path.resolve(`${app_path}/agents`)
export const pin_path = path.resolve(`${app_path}/pin.json`)

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
