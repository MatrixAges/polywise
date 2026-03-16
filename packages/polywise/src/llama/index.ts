import { env } from '@core/env'
import { getLlama } from 'node-llama-cpp'

import getModelContext from './getModelContext'

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
