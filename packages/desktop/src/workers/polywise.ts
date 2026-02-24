import { Console, Polywise } from 'polywise'

import type { ProcessArticleArgs, QueryArgs } from 'polywise'

type UpdateArgs = {
	memory_id: string
	content: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	metadata?: Record<string, unknown>
}

type ForgetArgs = {
	memory_id?: string
	query?: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
}

type SnapshotArgs = {
	weight_threshold?: number
	limit?: number
}

type RecallArgs = {
	query: string
	max_depth?: number
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	limit?: number
}

type IdolArgs = {
	idol_id: string
}

type MemoryMethod =
	| 'init'
	| 'save'
	| 'query'
	| 'update'
	| 'forget'
	| 'snapshot'
	| 'recall'
	| 'getNodes'
	| 'getNodesByIdol'
	| 'getEdgesByIdol'

type SaveRequestMessage = {
	type: 'memory_call'
	request_id: string
	data_dir: string
	method: MemoryMethod
	args: unknown
}

type SaveReadyMessage = {
	type: 'save_ready'
}

type WorkerProcess = NodeJS.Process & {
	send?: (message: unknown) => void
}

const worker_process = process as WorkerProcess

const writeLog = (event_name: string, payload?: Record<string, unknown>) => {
	Console.log('SYSTEM', event_name, payload)
}

const poly = new Polywise()

let active_data_dir = ''

process.on('uncaughtException', error => {
	writeLog('uncaught_exception', { error_message: error.message })
})

process.on('unhandledRejection', reason => {
	const error_message = reason instanceof Error ? reason.message : String(reason)

	writeLog('unhandled_rejection', { error_message })
})

process.on('exit', code => {
	writeLog('process_exit', { code })
})

const unwrapMessage = (message: unknown) => {
	if (!message || typeof message !== 'object') return message

	const typed_message = message as { data?: unknown }

	if (typed_message.data && typeof typed_message.data === 'object') {
		return typed_message.data
	}

	return message
}

const isSaveRequestMessage = (message: unknown) => {
	if (!message || typeof message !== 'object') return false

	const typed_message = message as Partial<SaveRequestMessage>

	return (
		typed_message.type === 'memory_call' &&
		typeof typed_message.request_id === 'string' &&
		typeof typed_message.data_dir === 'string' &&
		typeof typed_message.method === 'string'
	)
}

const initPoly = async (data_dir: string) => {
	if (active_data_dir === data_dir) {
		writeLog('init_skip', { data_dir })
		return
	}

	writeLog('init_start', { data_dir })

	if (active_data_dir) {
		await poly.off()
	}

	await poly.init({
		data_dir
	})

	active_data_dir = data_dir

	writeLog('init_done', { data_dir })
}

const runMemoryMethod = async (method: MemoryMethod, args: unknown) => {
	if (method === 'init') return true

	if (method === 'save') return await poly.save(args as ProcessArticleArgs)

	if (method === 'query') return await poly.query(args as QueryArgs)

	if (method === 'update') return await poly.update(args as UpdateArgs)

	if (method === 'forget') return await poly.forget(args as ForgetArgs)

	if (method === 'snapshot') {
		const snapshot_args = args as SnapshotArgs | undefined

		return await poly.getSnapshot(snapshot_args?.weight_threshold, snapshot_args?.limit)
	}

	if (method === 'recall') return await poly.recallFromMemory(args as RecallArgs)

	if (method === 'getNodes') return await poly.getAllNodes()

	if (method === 'getNodesByIdol') {
		const idol_args = args as IdolArgs

		return await poly.getNodesByIdol(idol_args.idol_id)
	}

	if (method === 'getEdgesByIdol') {
		const idol_args = args as IdolArgs

		return await poly.getEdgesByIdol(idol_args.idol_id)
	}

	throw new Error('unsupported memory method')
}

const handleSave = async (message: SaveRequestMessage) => {
	try {
		writeLog('call_received', { request_id: message.request_id, method: message.method })

		await initPoly(message.data_dir)

		const start_time = Date.now()

		const data = await runMemoryMethod(message.method, message.args)

		writeLog('call_done', {
			request_id: message.request_id,
			method: message.method,
			duration_ms: Date.now() - start_time
		})

		worker_process.send?.({
			type: 'memory_result',
			request_id: message.request_id,
			ok: true,
			data
		})
	} catch (error) {
		const error_message = error instanceof Error ? error.message : String(error)

		writeLog('call_error', {
			request_id: message.request_id,
			method: message.method,
			error_message
		})

		worker_process.send?.({
			type: 'memory_result',
			request_id: message.request_id,
			ok: false,
			error_message
		})
	}
}

const startPolySaveWorker = () => {
	if (!worker_process.send) {
		writeLog('parent_port_missing')
		process.exit(1)
		return
	}

	const ready_message: SaveReadyMessage = { type: 'save_ready' }

	worker_process.send(ready_message)
	writeLog('boot', { pid: process.pid })

	worker_process.on('message', payload => {
		const message = unwrapMessage(payload)

		if (!isSaveRequestMessage(message)) {
			writeLog('call_ignored', { message_type: typeof message })
			return
		}

		const save_message = message as SaveRequestMessage

		writeLog('call_dispatch', { request_id: save_message.request_id, method: save_message.method })

		void handleSave(save_message)
	})
}

startPolySaveWorker()
