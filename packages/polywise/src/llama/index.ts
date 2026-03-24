import { env } from '@core/env'
import { getLlama } from 'node-llama-cpp'
import { getId } from 'stk/utils'

import getModelContext from './getModelContext'

const embedding_tasks = new Set<string>()
const rerank_tasks = new Set<string>()
const gen_tasks = new Set<string>()

let llama_promise: Promise<void> | null = null
let llama_timer: ReturnType<typeof setTimeout> | null = null

export type LocalModelType = 'embedding' | 'rerank' | 'gen'

interface Progress {
	total: number
	downloaded: number
	percent: number
}

export type ModelProgress = Record<LocalModelType, Progress | null>

export const progress: ModelProgress = {
	embedding: null,
	rerank: null,
	gen: null
}

export const addTask = (type: LocalModelType) => {
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

export const removeTask = (type: LocalModelType, id: string) => {
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

export const isTasksEmpty = (type: LocalModelType) => {
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
	if (env.embedding_context) {
		await env.embedding_context.dispose()
		// @ts-ignore
		env.embedding_context = null
	}
	if (env.embedding_model) {
		await env.embedding_model.dispose()
		// @ts-ignore
		env.embedding_model = null
	}
	if (env.rerank_context) {
		await env.rerank_context.dispose()
		// @ts-ignore
		env.rerank_context = null
	}
	if (env.rerank_model) {
		await env.rerank_model.dispose()
		// @ts-ignore
		env.rerank_model = null
	}
	if (env.gen_context) {
		await env.gen_context.dispose()
		// @ts-ignore
		env.gen_context = null
	}
	if (env.gen_model) {
		await env.gen_model.dispose()
		// @ts-ignore
		env.gen_model = null
	}
}

export const disposeLlama = async () => {
	if (embedding_tasks.size === 0 && rerank_tasks.size === 0 && gen_tasks.size === 0) {
		await disposeModels()

		if (env.llama) {
			await env.llama.dispose()
			// @ts-ignore
			env.llama = null
		}

		if (llama_timer) {
			clearInterval(llama_timer)

			llama_timer = null
		}
	}
}

export const initLlama = async () => {
	if (env.llama) return

	if (!llama_promise) {
		llama_promise = (async () => {
			env.llama = await getLlama()

			if (!llama_timer) {
				llama_timer = setInterval(disposeLlama, 30000)
			}

			llama_promise = null
		})()
	}

	await llama_promise
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
