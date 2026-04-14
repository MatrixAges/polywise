import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { initAutoClean } from './fst'
import { initDefaults, initServer } from './utils'

await initServer()
await initDefaults()
await initConfig()
await initEnv()

initAutoClean()

export type { Router } from './rpc'
