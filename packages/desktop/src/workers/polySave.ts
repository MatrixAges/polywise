import { Polywise } from 'polywise'

import type { ProcessArticleArgs } from 'polywise'

type SaveRequestMessage = {
	type: 'save'
	request_id: string
	data_dir: string
	input: ProcessArticleArgs
}

type WorkerPort = {
	on: (event: 'message', listener: (message: unknown) => void) => void
	postMessage: (message: unknown) => void
}

type WorkerProcess = NodeJS.Process & {
	parentPort?: WorkerPort
}

const poly = new Polywise()

let active_data_dir = ''

const worker_process = process as WorkerProcess

const isSaveRequestMessage = (message: unknown) => {
	if (!message || typeof message !== 'object') return false

	const typed_message = message as Partial<SaveRequestMessage>

	return (
		typed_message.type === 'save' &&
		typeof typed_message.request_id === 'string' &&
		typeof typed_message.data_dir === 'string' &&
		typeof typed_message.input === 'object'
	)
}

const initPoly = async (data_dir: string) => {
	if (active_data_dir === data_dir) return

	if (active_data_dir) {
		await poly.off()
	}

	await poly.init({ data_dir })

	active_data_dir = data_dir
}

const handleSave = async (message: SaveRequestMessage) => {
	try {
		await initPoly(message.data_dir)

		const memory_id = await poly.save(message.input)

		worker_process.parentPort?.postMessage({
			type: 'save_result',
			request_id: message.request_id,
			ok: true,
			memory_id
		})
	} catch (error) {
		const error_message = error instanceof Error ? error.message : String(error)

		worker_process.parentPort?.postMessage({
			type: 'save_result',
			request_id: message.request_id,
			ok: false,
			error_message
		})
	}
}

const startPolySaveWorker = () => {
	worker_process.parentPort?.on('message', message => {
		if (!isSaveRequestMessage(message)) return

		void handleSave(message)
	})
}

export default startPolySaveWorker
