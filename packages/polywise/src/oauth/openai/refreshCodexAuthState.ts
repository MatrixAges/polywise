import fs from 'fs-extra'

import { codex_auth_path, codex_client_id, codex_token_url } from './constants'
import { normalizeCodexAuthState, readCodexAuthFile } from './readCodexAuthState'

import type { CodexAuthFile } from './types'

interface RefreshTokenResponse {
	access_token?: string
	refresh_token?: string
	id_token?: string
}

export default async () => {
	const current_file = await readCodexAuthFile()
	const current_state = normalizeCodexAuthState(current_file)

	if (!current_file || !current_state) {
		return null
	}

	const response = await fetch(codex_token_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: current_state.refresh_token,
			client_id: codex_client_id
		})
	})

	if (!response.ok) {
		return null
	}

	const payload = (await response.json().catch(() => null)) as RefreshTokenResponse | null

	if (!payload?.access_token || !payload.refresh_token) {
		return null
	}

	const next_file = {
		...current_file,
		auth_mode: current_file.auth_mode || current_state.auth_mode,
		last_refresh: new Date().toISOString(),
		tokens: {
			...(current_file.tokens ?? {}),
			access_token: payload.access_token,
			refresh_token: payload.refresh_token,
			id_token: payload.id_token ?? current_state.id_token,
			account_id: current_state.account_id
		}
	} satisfies CodexAuthFile

	await fs.writeJson(codex_auth_path, next_file, { spaces: 2 })

	return normalizeCodexAuthState(next_file)
}
