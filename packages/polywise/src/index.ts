import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { initAutoClean } from './fst'
import { startQueue } from './task'
import { initDefaults, initServer } from './utils'

await initServer()
await initDefaults()
await initConfig()
await initEnv()

startQueue()
initAutoClean()

export type { Router } from './rpc'
