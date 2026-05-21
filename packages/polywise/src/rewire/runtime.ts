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
	last_foreground_at: Date.now(),
	last_visit_at: Date.now()
})

export const createRewireRuntime = (): RewireRuntime => {
	const status = defaultStatus()
	let timer: NodeJS.Timeout | null = null
	let cycle_timer: NodeJS.Timeout | null = null

	const persistStatus = async () => {
		await writeRewireStatus(status).catch(() => null)
	}

	const stopCycleTimer = () => {
		if (cycle_timer) {
			clearInterval(cycle_timer)
			cycle_timer = null
			runtime.cycle_timer = null
		}
	}

	const runTick = async () => {
		if (status.running) {
			return
		}

		await runtime.runOnce()
	}

	const runtime: RewireRuntime = {
		timer,
		cycle_timer,
		status,
		async start() {
			const saved_status = await readRewireStatus()

			Object.assign(status, {
				...saved_status,
				running: false,
				last_status: saved_status.last_status ?? 'idle',
				last_error: saved_status.last_error ?? null,
				last_summary: saved_status.last_summary ?? null,
				last_foreground_at: Date.now(),
				last_visit_at: Number(saved_status.last_visit_at ?? Date.now())
			})

			const monitor = async () => {
				const current_runtime = runtime

				const allowed = await shouldRun(current_runtime)

				if (!allowed.ok) {
					stopCycleTimer()
					status.last_status = 'idle'
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

				if (!cycle_timer) {
					cycle_timer = setInterval(() => {
						void runTick().catch(error => {
							log('SYSTEM', 'rewireCycleTickError', () =>
								error instanceof Error ? error.message : String(error)
							)
						})
					}, getRewireConfig().tick_ms)
					runtime.cycle_timer = cycle_timer
					void runTick().catch(error => {
						log('SYSTEM', 'rewireCycleStartError', () =>
							error instanceof Error ? error.message : String(error)
						)
					})
				}
			}

			timer = setInterval(() => {
				void monitor().catch(error => {
					log('SYSTEM', 'rewireMonitorError', () =>
						error instanceof Error ? error.message : String(error)
					)
				})
			}, getRewireConfig().monitor_ms)
			runtime.timer = timer
			await monitor().catch(() => null)
			await persistStatus()
		},
		async stop() {
			if (timer) {
				clearInterval(timer)
				timer = null
				runtime.timer = null
			}
			stopCycleTimer()

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
			if (!status.running) {
				stopCycleTimer()
				status.last_status = 'idle'
			}
		},
		touchVisit() {
			const now = Date.now()
			status.last_visit_at = now
			status.last_foreground_at = now
			if (!status.running) {
				stopCycleTimer()
				status.last_status = 'idle'
			}
		}
	}

	return runtime
}
