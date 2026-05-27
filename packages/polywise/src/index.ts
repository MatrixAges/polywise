import './server'

import { initConfig } from './config'
import { initEnv } from './env'
import { initAutoClean, initMcps } from './fst'
import ensureSkillDefaults from './rpc/skill/ensureDefaults'
import { calibrateRunningSessions, initDefaults, initServer } from './utils'

await initDefaults()
await initConfig()
await initEnv()
await initServer()
await initMcps()
await calibrateRunningSessions()
await ensureSkillDefaults()

initAutoClean()

export type { Router } from './rpc'
export type { RouterInputs, RouterOutputs } from './rpc'
