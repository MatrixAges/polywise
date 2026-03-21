import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { startQueue } from './task'
import { initServer } from './utils'

await initServer()
await initConfig()
await initEnv()

startQueue()

export type { Router } from './rpc'
