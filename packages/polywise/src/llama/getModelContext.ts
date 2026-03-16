import { env } from '../env'
import { getEmbeddingModel, getGenModel, getRerankModel } from '../llama/getModel'
import { isTasksEmpty } from './index'

import type { Llama, LlamaContext, LlamaEmbeddingContext, LlamaModel, LlamaRankingContext } from 'node-llama-cpp'

interface ContextState {
	model_promise: Promise<void> | null
	timer: ReturnType<typeof setTimeout> | null
	promise: Promise<void> | null
}

type EnvKey = keyof typeof env

const context_state = {
	embedding: { model_promise: null, timer: null, promise: null } as ContextState,
	rerank: { model_promise: null, timer: null, promise: null } as ContextState,
	gen: { model_promise: null, timer: null, promise: null } as ContextState
}

export default async (type: 'embedding' | 'rerank' | 'gen') => {
	const model_key = `${type}_model` as EnvKey
	const context_key = `${type}_context` as EnvKey
	const state = context_state[type]

	if (!env[model_key] && !state.model_promise) {
		let fetcher: (llama: Llama) => Promise<LlamaModel>

		if (type === 'embedding') fetcher = getEmbeddingModel
		else if (type === 'rerank') fetcher = getRerankModel
		else fetcher = getGenModel

		state.model_promise = fetcher(env.llama).then(model => {
			// @ts-ignore
			env[model_key] = model

			state.model_promise = null
		})
	}

	if (state.model_promise) {
		await state.model_promise
	}

	if (!env[context_key] && !state.promise) {
		const model = env[model_key] as LlamaModel

		let creator: () => Promise<LlamaEmbeddingContext | LlamaRankingContext | LlamaContext>

		if (type === 'embedding') creator = () => model.createEmbeddingContext()
		else if (type === 'rerank') creator = () => model.createRankingContext()
		else creator = () => model.createContext()

		state.promise = creator().then(ctx => {
			// @ts-ignore
			env[context_key] = ctx

			state.promise = null
		})
	}

	if (state.promise) {
		await state.promise
	}

	resetContextTimer(type)
}

const resetContextTimer = (type: 'embedding' | 'rerank' | 'gen') => {
	const context_key = `${type}_context` as EnvKey
	const state = context_state[type]

	if (state.timer) {
		clearTimeout(state.timer)

		state.timer = null
	}

	state.timer = setTimeout(async () => {
		const ctx = env[context_key] as LlamaContext

		if (ctx) {
			const is_empty = isTasksEmpty(type)

			if (!is_empty) return resetContextTimer(type)
			// @ts-ignore
			env[context_key] = null

			await ctx.dispose()
		}
	}, 30000)
}
