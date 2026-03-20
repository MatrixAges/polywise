import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { startQueue } from './task'
import { initServer } from './utils'

await initEnv()
await initServer()
await initConfig()

startQueue()

export type { Router } from './rpc'
