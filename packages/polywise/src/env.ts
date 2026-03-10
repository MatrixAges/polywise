import { getLlama } from 'node-llama-cpp'

import { app } from './consts'
import { getEmbeddingModel, getGenModel, getRerankModel } from './utils'

import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'

interface Env {
	pglite_data_dir: string
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

export const initEnv = async () => {
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
	await initEnv()
	await Promise.all([initEmbeddingModel(), initRerankModel(), initGenModel()])
}
