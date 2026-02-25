import { Console, Polywise } from 'polywise'
import workerpool from 'workerpool'

import type { GetNodeRelatedArgs, ProcessArticleArgs, QueryArgs } from 'polywise'

type UpdateArgs = {
	memory_id: string
	content: string
	idol_id?: string
	root_ids?: Array<string>
	metadata?: Record<string, unknown>
}

type ForgetArgs = {
	memory_id?: string
	query?: string
	idol_id?: string
	root_ids?: Array<string>
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
	limit?: number
}

const poly = new Polywise()

let active_data_dir = ''

const writeLog = (event_name: string, payload?: Record<string, unknown>) => {
	Console.log('SYSTEM', event_name, payload)
}

const initPoly = async (data_dir: string) => {
	if (active_data_dir === data_dir) {
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

const handleTask = async (method: string, args: any, data_dir: string) => {
	await initPoly(data_dir)

	const start_time = Date.now()

	try {
		let result: any

		switch (method) {
			case 'init':
				result = true
				break
			case 'save':
				result = await poly.save(args as ProcessArticleArgs)
				break
			case 'query':
				result = await poly.query(args as QueryArgs)
				break
			case 'update':
				result = await poly.update(args as UpdateArgs)
				break
			case 'forget':
				result = await poly.forget(args as ForgetArgs)
				break
			case 'snapshot': {
				const snapshot_args = args as SnapshotArgs | undefined
				result = await poly.getSnapshot(snapshot_args?.weight_threshold, snapshot_args?.limit)
				break
			}
			case 'recall':
				result = await poly.recallFromMemory(args as RecallArgs)
				break
			case 'getNodeRelated':
				result = await poly.getNodeRelated(args as GetNodeRelatedArgs)
				break
			default:
				throw new Error(`Unsupported method: ${method}`)
		}

		writeLog('method_call_done', {
			method,
			duration_ms: Date.now() - start_time
		})

		return result
	} catch (error) {
		const error_message = error instanceof Error ? error.message : String(error)

		writeLog('method_call_error', {
			method,
			error_message
		})

		throw error
	}
}

workerpool.worker({
	exec: handleTask
})
