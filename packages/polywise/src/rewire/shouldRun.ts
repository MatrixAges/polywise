import { env } from '@core/env'

import { getRewireConfig } from './constants'

import type { RewireRuntime } from './types'

export default async (runtime: RewireRuntime) => {
	const current_config = getRewireConfig()

	if (!current_config.enabled) {
		return { ok: false, reason: 'disabled' as const }
	}

	if (runtime.status.running) {
		return { ok: false, reason: 'already_running' as const }
	}

	if (env.active) {
		return { ok: false, reason: 'foreground_active' as const }
	}

	const last_active_at = Math.max(
		Number(runtime.status.last_foreground_at ?? 0),
		Number(runtime.status.last_visit_at ?? 0)
	)

	if (Date.now() - last_active_at < current_config.idle_grace_ms) {
		return { ok: false, reason: 'idle_grace' as const }
	}

	const row = env.sqlite.prepare('SELECT id FROM session WHERE runing = 1 LIMIT 1').get() as
		| { id: string }
		| undefined

	if (row?.id) {
		return { ok: false, reason: 'session_running' as const }
	}

	return { ok: true as const }
}
