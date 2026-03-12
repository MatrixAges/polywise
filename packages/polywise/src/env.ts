import { PGlite } from '@electric-sql/pglite'
import { live } from '@electric-sql/pglite/live'
import { vector } from '@electric-sql/pglite/vector'
import { getLlama } from 'node-llama-cpp'

import { app } from './consts'
import { migrate } from './db'
import { getEmbeddingModel, getGenModel, getRerankModel } from './utils'

import type { LiveNamespace } from '@electric-sql/pglite/live'
import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'

interface Env {
	pglite_data_dir: string
	pglite: PGlite & { vector: unknown; live: LiveNamespace }
	llama: Llama
	embedding_model: LlamaModel
	embedding_context: LlamaEmbeddingContext
	rerank_model: LlamaModel
	rerank_context: LlamaRankingContext
	gen_model: LlamaModel
	gen_context: LlamaContext
}

export const env = {
	pglite_data_dir: app.data_dir
} as Env

export const initPglite = async () => {
	env.pglite = await PGlite.create(env.pglite_data_dir, { extensions: { vector, live } })
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
	await initPglite()
	await migrate()
	await initModels()
}
