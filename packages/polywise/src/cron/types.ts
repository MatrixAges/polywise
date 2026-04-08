import type { Cron } from 'croner'

export interface CronJob {
	name: string
	cron: string
	enabled: boolean
	last_run_at: string | null
	last_status: 'idle' | 'success' | 'error'
	last_error: string | null
	created_at: string
	updated_at: string
}

export interface CronStore {
	version: number
	jobs: Array<CronJob>
}

export interface CronRuntime {
	store: CronStore
	jobs: Map<string, Cron>
}
