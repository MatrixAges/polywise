import { initCron } from './cron'
import { initDB, initDrizzle, initSql, migrate } from './db'
import { initImRuntime } from './im'
import { initRewireRuntime } from './rewire'
import { initLinkcaseScheduleRuntime } from './rpc/linkcase/scheduler'

import type { Database } from 'better-sqlite3'
import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'
import type { CronRuntime } from './cron'
import type { ImRuntime } from './im'
import type { RewireRuntime } from './rewire'

interface Env {
	sqlite: Database
	db: ReturnType<typeof initDrizzle>
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
	active: boolean
}

export const env = { active: true } as Env

export const initEnv = async () => {
	initDB()
	initDrizzle()
	migrate()
	initSql()

	await initCron()
	await initImRuntime()
	await initRewireRuntime()
	await initLinkcaseScheduleRuntime()
}

export const setActive = (active: boolean) => {
	env.active = active
}
