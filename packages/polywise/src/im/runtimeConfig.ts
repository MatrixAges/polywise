import { normalizeSessionRuntimeConfig } from '@core/fst/session/config/shared'

import { safeJsonParse } from './utils'

import type { ImAccount } from '@core/db'

export type ImSessionTargetType = 'global' | 'agent' | 'group'

export interface ImSessionTargetConfig {
	type: ImSessionTargetType
	agent_id?: string
	group_id?: string
}

const default_im_session_target: ImSessionTargetConfig = {
	type: 'global'
}

export const normalizeImSessionTargetConfig = (input: unknown): ImSessionTargetConfig => {
	if (!input || typeof input !== 'object') {
		return default_im_session_target
	}

	const target = input as Record<string, unknown>
	const type =
		target.type === 'agent' || target.type === 'group' || target.type === 'global' ? target.type : 'global'
	const agent_id = typeof target.agent_id === 'string' ? target.agent_id.trim() : ''
	const group_id = typeof target.group_id === 'string' ? target.group_id.trim() : ''

	if (type === 'agent' && agent_id) {
		return { type, agent_id }
	}

	if (type === 'group' && group_id) {
		return { type, group_id }
	}

	return default_im_session_target
}

export const getImAccountRuntimeConfig = (account: Pick<ImAccount, 'config_json'>) => {
	const config = safeJsonParse(account.config_json, {})
	const runtime = config && typeof config === 'object' ? (config as { runtime?: unknown }).runtime : undefined

	return normalizeSessionRuntimeConfig(runtime as any)
}

export const getImAccountSessionTargetConfig = (account: Pick<ImAccount, 'config_json'>) => {
	const config = safeJsonParse(account.config_json, {})
	const session_target =
		config && typeof config === 'object' ? (config as { session_target?: unknown }).session_target : undefined

	return normalizeImSessionTargetConfig(session_target)
}
