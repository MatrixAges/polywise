import './apis'

import { initEnv } from './env'
import { initServer } from './utils'

await initEnv()
await initServer()

export type { Router } from './rpcs'
