import { initEnv } from './env'
import { initServer } from './server'

await initEnv()
await initServer()

export type { Router } from './rpcs'
