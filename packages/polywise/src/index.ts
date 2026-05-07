import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { initAutoClean, initMcps } from './fst'
import ensureSkillDefaults from './rpc/skill/ensureDefaults'
import { initDefaults, initServer } from './utils'

await initServer()
await initDefaults()
await initConfig()
await initMcps()
await initEnv()
await ensureSkillDefaults()

initAutoClean()

export type { Router } from './rpc'
export type { RouterInputs, RouterOutputs } from './rpc'
