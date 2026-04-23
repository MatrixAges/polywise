import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { initAutoClean, initMcps } from './fst'
import { initDefaults, initServer } from './utils'

await initServer()
await initDefaults()
await initConfig()
await initMcps()
await initEnv()

initAutoClean()

export type { Router } from './rpc'
