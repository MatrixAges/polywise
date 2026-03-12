import { dirname } from 'path'
import Sqlite from 'better-sqlite3'
import fs from 'fs-extra'
import { getLlama } from 'node-llama-cpp'
import { load as loadVec } from 'sqlite-vec'

import { app } from './consts'
import { getDrizzleDB, migrate } from './db'
import initSql from './db/initSql'
import { getEmbeddingModel, getGenModel, getRerankModel } from './utils'

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
	env.embedding_model = await getEmbeddingModel(env.llama)
	env.embedding_context = await env.embedding_model.createEmbeddingContext()
}

export const initRerankModel = async () => {
	env.rerank_model = await getRerankModel(env.llama)
	env.rerank_context = await env.rerank_model.createRankingContext()
}

export const initGenModel = async () => {
	env.gen_model = await getGenModel(env.llama)
	env.gen_context = await env.gen_model.createContext()
}

export const initModels = async () => {
	await initLlama()
	await Promise.all([initEmbeddingModel(), initRerankModel(), initGenModel()])
}

export const initEnv = async () => {
	initDB()
	initSql()
	initDrizzle()
	migrate()

	// await initModels()
}
