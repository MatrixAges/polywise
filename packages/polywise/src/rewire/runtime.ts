import { log } from '@core/utils'

import { getRewireConfig } from './constants'
import runCycle from './runCycle'
import shouldRun from './shouldRun'
import { readRewireStatus, writeRewireStatus } from './status'

import type { RewireRuntime, RewireRuntimeStatus } from './types'

const defaultStatus = (): RewireRuntimeStatus => ({
	running: false,
	last_cycle_at: null,
	last_status: 'idle',
	last_error: null,
	last_summary: null,
	last_foreground_at: Date.now()
})

export const createRewireRuntime = (): RewireRuntime => {
	const status = defaultStatus()
	let timer: NodeJS.Timeout | null = null

	const persistStatus = async () => {
		await writeRewireStatus(status).catch(() => null)
	}

	const runtime: RewireRuntime = {
		timer,
		status,
		async start() {
			const saved_status = await readRewireStatus()

			Object.assign(status, {
				...saved_status,
				running: false,
				last_status: saved_status.last_status ?? 'idle',
				last_error: saved_status.last_error ?? null,
				last_summary: saved_status.last_summary ?? null,
				last_foreground_at: Date.now()
			})

			const tick = async () => {
				const current_runtime = runtime

				if (status.running) {
					return
				}

				const allowed = await shouldRun(current_runtime)

				if (!allowed.ok) {
					const next_summary = {
						cycle_at: Date.now(),
						skipped: true,
						reason: allowed.reason,
						groups_processed: 0,
						events_deleted: 0,
						edges_created: 0,
						edges_strengthened: 0,
						edges_promoted: 0,
						edges_pruned: 0,
						edges_downgraded: 0,
						edges_decayed: 0,
						touched_nodes: 0
					}
					const prev = status.last_summary

					status.last_summary = next_summary

					if (
						!prev ||
						!prev.skipped ||
						prev.reason !== next_summary.reason ||
						Date.now() - Number(prev.cycle_at ?? 0) >= 60_000
					) {
						await persistStatus()
					}
					return
				}

				await current_runtime.runOnce()
			}

			timer = setInterval(() => {
				void tick().catch(error => {
					log('SYSTEM', 'rewireTickError', () =>
						error instanceof Error ? error.message : String(error)
					)
				})
			}, getRewireConfig().tick_ms)
			runtime.timer = timer
			await persistStatus()
		},
		async stop() {
			if (timer) {
				clearInterval(timer)
				timer = null
				runtime.timer = null
			}

			await persistStatus()
		},
		async runOnce() {
			status.running = true
			status.last_status = 'running'
			status.last_error = null
			await persistStatus()

			try {
				const summary = await runCycle()
				status.last_cycle_at = summary.cycle_at
				status.last_status = 'success'
				status.last_error = null
				status.last_summary = summary
				await persistStatus()
				return summary
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				status.last_cycle_at = Date.now()
				status.last_status = 'error'
				status.last_error = message
				status.last_summary = {
					cycle_at: status.last_cycle_at,
					skipped: true,
					reason: message,
					groups_processed: 0,
					events_deleted: 0,
					edges_created: 0,
					edges_strengthened: 0,
					edges_promoted: 0,
					edges_pruned: 0,
					edges_downgraded: 0,
					edges_decayed: 0,
					touched_nodes: 0
				}
				await persistStatus()
				throw error
			} finally {
				status.running = false
				await persistStatus()
			}
		},
		touchForeground() {
			status.last_foreground_at = Date.now()
		}
	}

	return runtime
}
