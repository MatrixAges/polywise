import { trpcServer } from '@hono/trpc-server'
import { cors } from 'hono/cors'

import { router } from './rpcs'
import { server } from './utils'

server.use('*', cors())
server.all('/trpc/*', trpcServer({ router }))
