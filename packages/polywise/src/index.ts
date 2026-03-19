import './server'

import { initEnv } from './env'
import handleTriples from './io/save/saveArticle/handleTriples'
import { TaskQueue } from './task'
import { initServer } from './utils'

await initEnv()
await initServer()

const task_queue = new TaskQueue()
task_queue.registerHandler(
	'handleTriples',
	handleTriples as unknown as (args: Record<string, unknown>) => Promise<void>
)

setTimeout(() => {
	task_queue.start()
}, 6000)

export type { Router } from './rpc'
