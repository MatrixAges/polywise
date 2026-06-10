import fs from 'fs-extra'

import { codex_auth_path } from './constants'

import type { CodexAuthFile, CodexAuthState } from './types'

const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const normalizeCodexAuthState = (value: CodexAuthFile | null) => {
	const tokens = value?.tokens

	if (!tokens || typeof tokens !== 'object') {
		return null as CodexAuthState | null
	}

	const access_token = getString(tokens.access_token)
	const refresh_token = getString(tokens.refresh_token)
	const account_id = getString(tokens.account_id)

	if (!access_token || !refresh_token || !account_id) {
		return null as CodexAuthState | null
	}

	return {
		auth_mode: getString(value?.auth_mode) || 'chatgpt',
		last_refresh: getString(value?.last_refresh) || null,
		access_token,
		refresh_token,
		id_token: getString(tokens.id_token),
		account_id
	} satisfies CodexAuthState
}

export const readCodexAuthFile = async () => {
	return (await fs.readJson(codex_auth_path).catch(() => null)) as CodexAuthFile | null
}

export default async () => {
	return normalizeCodexAuthState(await readCodexAuthFile())
}
