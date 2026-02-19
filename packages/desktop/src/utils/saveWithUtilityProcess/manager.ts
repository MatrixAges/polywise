import { randomUUID } from 'crypto'
import path from 'path'
import { utilityProcess } from 'electron'
import { pathExistsSync } from 'fs-extra'

import type { UtilityProcess } from 'electron'
import type { ProcessArticleArgs } from 'polywise'

type PendingTask = {
	resolve: (memory_id: string) => void
	reject: (error: Error) => void
	timeout_id: ReturnType<typeof setTimeout>
}

type SaveResultMessage = {
	type: 'save_result'
	request_id: string
	ok: boolean
	memory_id?: string
	error_message?: string
}

const getWorkerPath = () => {
	const candidate_paths = [
		path.join(__dirname, 'poly-save-worker.js'),
		path.join(__dirname, 'dist/poly-save-worker.js')
	]

	const resolved_path = candidate_paths.find(candidate_path => pathExistsSync(candidate_path))

	return resolved_path || candidate_paths[0]
}

export default class PolySaveUtilityProcess {
	private child: UtilityProcess | null = null

	private pending_map = new Map<string, PendingTask>()

	private save_queue = Promise.resolve()

	private ensureWorker() {
		if (this.child) return

		const worker_path = getWorkerPath()

		this.child = utilityProcess.fork(worker_path)
		this.child.on('message', message => this.handleMessage(message))

		this.child.on('exit', () => {
			this.rejectAll('poly save worker exited unexpectedly')
			this.child = null
		})
	}

	async save(input: ProcessArticleArgs, data_dir: string) {
		const run_task = async () => {
			return await this.executeSave(input, data_dir)
		}

		const queued_task = this.save_queue.then(run_task, run_task)

		this.save_queue = queued_task.then(
			() => undefined,
			() => undefined
		)

		return await queued_task
	}

	private async executeSave(input: ProcessArticleArgs, data_dir: string) {
		this.ensureWorker()

		return await new Promise<string>((resolve, reject) => {
			const request_id = randomUUID()

			const timeout_id = setTimeout(() => {
				this.restartWorker('poly save worker timeout')
			}, 30000)

			this.pending_map.set(request_id, { resolve, reject, timeout_id })
			this.child?.postMessage({ type: 'save', request_id, data_dir, input })
		})
	}

	private handleMessage(message: unknown) {
		if (!message || typeof message !== 'object') return

		const typed_message = message as Partial<SaveResultMessage>
		if (typed_message.type !== 'save_result' || typeof typed_message.request_id !== 'string') return

		const task = this.pending_map.get(typed_message.request_id)
		if (!task) return

		this.pending_map.delete(typed_message.request_id)
		clearTimeout(task.timeout_id)

		if (typed_message.ok && typeof typed_message.memory_id === 'string') {
			task.resolve(typed_message.memory_id)
			return
		}

		task.reject(new Error(typed_message.error_message || 'poly save worker failed'))
	}

	private rejectAll(error_message: string) {
		for (const [request_id, task] of this.pending_map.entries()) {
			clearTimeout(task.timeout_id)
			task.reject(new Error(error_message))
			this.pending_map.delete(request_id)
		}
	}

	private restartWorker(error_message: string) {
		if (this.child) {
			this.child.removeAllListeners()
			this.child.kill()
			this.child = null
		}

		this.rejectAll(error_message)
	}
}
