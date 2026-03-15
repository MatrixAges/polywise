import { trpcServer } from '@hono/trpc-server'
import { cors } from 'hono/cors'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import apis from './api'
import { router } from './rpc'
import { server } from './utils'

server.use('*', cors())
server.all('/trpc/*', trpcServer({ router }))
server.all('/openapi/*', c => createOpenApiFetchHandler({ endpoint: '/openapi', req: c.req.raw, router }))

server.route('/api', apis)
