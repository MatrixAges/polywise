import { config } from '@core/config'

import { getRemoteEmbeddingRunner, resetRemoteEmbeddingRunner, setRemoteEmbeddingRunner } from './embeddingRunnerState'
import getRemoteEmbeddingModel from './getRemoteEmbeddingModel'

type EmbeddingRunner = (value: string) => Promise<Array<number>>

const jina_retry_base_delay_ms = 1500
const jina_retry_max_delay_ms = 12000
const jina_retry_limit = 4

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getErrorStatus = (error: unknown) => {
	if (!error || typeof error !== 'object') return null
	if ('status' in error && typeof error.status === 'number') return error.status
	if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode

	return null
}

const isRateLimitError = (error: unknown) => {
	if (getErrorStatus(error) === 429) return true
	if (!(error instanceof Error)) return false

	const message = error.message.toLowerCase()

	return (
		message.includes('too many requests') ||
		message.includes('rate limit') ||
		message.includes('rate-limit') ||
		message.includes('status 429') ||
		message.includes('status: 429') ||
		message.includes('(429)')
	)
}

const getRetryDelay = (attempt_index: number) => {
	const base_delay = Math.min(jina_retry_max_delay_ms, jina_retry_base_delay_ms * 2 ** attempt_index)
	const jitter = Math.floor(Math.random() * 250)

	return base_delay + jitter
}

const wrapJinaEmbeddingRunner = (runner: EmbeddingRunner): EmbeddingRunner => {
	let cooldown_until = 0
	let pending_task = Promise.resolve()

	const waitForCooldown = async () => {
		const now = Date.now()
		const wait_ms = Math.max(0, cooldown_until - now)

		if (wait_ms > 0) {
			await sleep(wait_ms)
		}
	}

	const runWithRetry = async (value: string) => {
		let attempt_index = 0

		while (true) {
			await waitForCooldown()

			try {
				return await runner(value)
			} catch (error) {
				if (!isRateLimitError(error) || attempt_index >= jina_retry_limit) {
					throw error
				}

				cooldown_until = Math.max(cooldown_until, Date.now() + getRetryDelay(attempt_index))
				attempt_index += 1
			}
		}
	}

	return value => {
		const current_task = pending_task.catch(() => undefined).then(() => runWithRetry(value))

		pending_task = current_task.then(
			() => undefined,
			() => undefined
		)

		return current_task
	}
}

export default async () => {
	const remote_embedding_runner = getRemoteEmbeddingRunner()

	if (remote_embedding_runner) return remote_embedding_runner

	const result = await getRemoteEmbeddingModel()

	if (!result) return null

	const runner = config.embedding_model?.provider === 'jina' ? wrapJinaEmbeddingRunner(result.run) : result.run

	setRemoteEmbeddingRunner(runner)

	return getRemoteEmbeddingRunner()
}

export { resetRemoteEmbeddingRunner }
