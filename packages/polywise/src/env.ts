import { initCron } from './cron'
import { initDB, initDrizzle, initSql, migrate } from './db'
import { initImRuntime } from './im'
import { initPthinkRuntime } from './pthink'
import initReportRuntime from './report/initReportRuntime'
import { initRewireRuntime } from './rewire'
import { initLinkcaseScheduleRuntime } from './rpc/linkcase/scheduler'

import type { Database } from 'better-sqlite3'
import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'
import type { CronRuntime } from './cron'
import type { ImRuntime } from './im'
import type { PthinkRuntime } from './pthink'
import type { RewireRuntime } from './rewire'

interface Env {
	sqlite: Database
	db: ReturnType<typeof initDrizzle>
	platform: 'standalone' | 'electron'
	llama: Llama
	embedding_model: LlamaModel
	embedding_context: LlamaEmbeddingContext
	rerank_model: LlamaModel
	rerank_context: LlamaRankingContext
	gen_model: LlamaModel
	gen_context: LlamaContext
	cron: CronRuntime
	im: ImRuntime
	rewire: RewireRuntime
	pthink: PthinkRuntime
	active: boolean
}

const runtime_platform_values = new Set<Env['platform']>(['standalone', 'electron'])

const parseRuntimePlatform = () => {
	const argv_value = process.argv.reduce<string | null>((current, item, index, list) => {
		if (current) return current
		if (item.startsWith('--platform=')) {
			return item.slice('--platform='.length)
		}

		if (item === '--platform') {
			return list[index + 1] || null
		}

		return null
	}, null)

	const env_value = process.env.POLYWISE_PLATFORM?.trim()
	const target = (argv_value || env_value || 'standalone').toLowerCase()

	return runtime_platform_values.has(target as Env['platform']) ? (target as Env['platform']) : 'standalone'
}

export const env = { active: true, platform: parseRuntimePlatform() } as Env

export const initEnv = async () => {
	initDB()
	initDrizzle()
	migrate()
	initSql()

	await initCron()
	await initImRuntime()
	await initRewireRuntime()
	await initPthinkRuntime()
	await initReportRuntime()
	await initLinkcaseScheduleRuntime()
}

export const setActive = (active: boolean) => {
	env.active = active

	if (active) {
		env.rewire?.touchForeground?.()
		env.pthink?.touchForeground?.()
	}
}
