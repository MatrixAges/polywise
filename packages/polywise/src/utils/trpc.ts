import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import type { OpenApiMeta } from 'trpc-to-openapi'

export type ProcedureMeta = OpenApiMeta

const t = initTRPC.meta<ProcedureMeta>().create({
	isServer: true,
	transformer: superjson
})

export const p = t.procedure
export const r = t.router
