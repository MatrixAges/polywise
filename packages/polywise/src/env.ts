import { initDB, initDrizzle, initSql, initSys, migrate } from './db'

import type { Database } from 'better-sqlite3'
import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'

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
}

export const env = {} as Env

export const initEnv = async () => {
	initDB()
	initDrizzle()
	migrate()
	initSql()
	initSys()
}
