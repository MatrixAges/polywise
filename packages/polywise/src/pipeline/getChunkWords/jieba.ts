import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Tinypool from 'tinypool'

export interface Word {
	word: string
	tag: string
}

let pool: Tinypool | null = null
let idle_timer: NodeJS.Timeout | null = null
let running_tasks = 0

const terminatePool = () => {
	if (!pool || running_tasks > 0) return
	pool.destroy()
	pool = null
}

const getPool = () => {
	if (idle_timer) {
		clearTimeout(idle_timer)

		idle_timer = null
	}

	if (pool) return pool

	const is_js = extname(fileURLToPath(import.meta.url)) === '.js'

	const worker_path = is_js
		? fileURLToPath(new URL('./pipeline/jieba.worker.js', import.meta.url))
		: fileURLToPath(new URL('./jieba.worker.ts', import.meta.url))

	pool = new Tinypool({ filename: worker_path, minThreads: 0, maxThreads: 1 })

	return pool
}

const tag = async (text: string) => {
	const current_pool = getPool()

	running_tasks++

	try {
		return await current_pool.run(text)
	} finally {
		running_tasks--

		if (idle_timer) clearTimeout(idle_timer)

		idle_timer = setTimeout(terminatePool, 30000)
	}
}

export default { tag }
