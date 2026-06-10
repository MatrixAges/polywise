import os from 'os'
import path from 'path'

export const codex_auth_path = path.resolve(os.homedir(), '.codex/auth.json')
export const codex_models_cache_path = path.resolve(os.homedir(), '.codex/models_cache.json')
export const codex_client_id = 'app_EMoamEEZ73f0CkXaXp7hrann'
export const codex_token_url = 'https://auth.openai.com/oauth/token'
export const codex_base_url = 'https://chatgpt.com/backend-api'
export const codex_dummy_api_key = 'chatgpt-oauth'
