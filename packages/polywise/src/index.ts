import './server'

import { initEnv } from './env'
import { TaskQueue } from './task'
import { initServer } from './utils'

await initEnv()
await initServer()

const task_queue = new TaskQueue()

setTimeout(() => {
	task_queue.start()
}, 6000)

export type { Router } from './rpc'
