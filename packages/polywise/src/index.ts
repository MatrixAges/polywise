import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { initTask } from './task'
import { initServer } from './utils'

await initEnv()
await initServer()
await initConfig()

initTask()

export type { Router } from './rpc'
