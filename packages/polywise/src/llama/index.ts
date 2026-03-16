import { env } from '@core/env'
import { getLlama } from 'node-llama-cpp'
import { getId } from 'stk/utils'

import getModelContext from './getModelContext'

const embedding_tasks = new Set<string>()
const rerank_tasks = new Set<string>()
const gen_tasks = new Set<string>()

type TaskType = 'embedding' | 'rerank' | 'gen'

export const addTask = (type: TaskType) => {
	const id = getId()

	switch (type) {
		case 'embedding':
			embedding_tasks.add(id)
			break
		case 'rerank':
			rerank_tasks.add(id)
			break
		case 'gen':
			gen_tasks.add(id)
			break
	}

	return id
}

export const removeTask = (type: TaskType, id: string) => {
	switch (type) {
		case 'embedding':
			embedding_tasks.delete(id)
			break
		case 'rerank':
			rerank_tasks.delete(id)
			break
		case 'gen':
			gen_tasks.delete(id)
			break
	}
}

export const isTasksEmpty = (type: TaskType) => {
	switch (type) {
		case 'embedding':
			return embedding_tasks.size === 0
		case 'rerank':
			return rerank_tasks.size === 0
		case 'gen':
			return gen_tasks.size === 0
	}
}

export const disposeModels = async () => {
	await env.embedding_context?.dispose()
	await env.embedding_model?.dispose()
	await env.rerank_context?.dispose()
	await env.rerank_model?.dispose()
	await env.gen_context?.dispose()
	await env.gen_model?.dispose()
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
