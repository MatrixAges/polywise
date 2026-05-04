import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import type { OpenApiMeta } from 'trpc-to-openapi'

const t = initTRPC.meta<OpenApiMeta>().create({
	isServer: true,
	transformer: superjson
})

export const p = t.procedure
export const r = t.router
