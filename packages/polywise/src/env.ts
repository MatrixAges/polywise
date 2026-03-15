import { dirname } from 'path'
import Sqlite from 'better-sqlite3'
import fs from 'fs-extra'
import { getLlama } from 'node-llama-cpp'
import { load as loadVec } from 'sqlite-vec'

import { app } from './consts'
import { getDrizzleDB, migrate } from './db'
import initSql from './db/initSql'
import { getModelContext } from './utils'

import type { Database } from 'better-sqlite3'
import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'

interface Env {
	db_path: string
	sqlite: Database
	db: ReturnType<typeof getDrizzleDB>
	llama: Llama
	embedding_model: LlamaModel
	embedding_context: LlamaEmbeddingContext
	rerank_model: LlamaModel
	rerank_context: LlamaRankingContext
	gen_model: LlamaModel
	gen_context: LlamaContext
}

export const env = {
	db_path: app.db_path
} as Env

export const initDB = () => {
	fs.ensureDirSync(dirname(env.db_path))

	env.sqlite = new Sqlite(env.db_path)

	env.sqlite.pragma('journal_mode = WAL')

	loadVec(env.sqlite)
}

export const initDrizzle = () => {
	env.db = getDrizzleDB()
}

export const initLlama = async () => {
	env.llama = await getLlama()
}

export const initEmbeddingModel = async () => {
	await getModelContext('embedding')
}

export const initRerankModel = async () => {
	await getModelContext('rerank')
}

export const initGenModel = async () => {
	await getModelContext('gen')
}

export const initModels = async () => {
	await Promise.all([initEmbeddingModel(), initRerankModel(), initGenModel()])
}

export const initEnv = async () => {
	initDB()
	initSql()
	initDrizzle()
	migrate()

	await initLlama()
	// await initModels()
}
