import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import api from './api'
import { router } from './rpc'
import { error_handler, error_middleware, openapi_handler } from './utils'

export const server = new Hono()

server.use('*', cors())
server.use('/trpc/*', error_middleware)

server.all('/trpc/*', trpcServer({ router }))
server.all('/api/*', openapi_handler)

server.route('/sys', api)

server.onError(error_handler)
