import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import type { CliProcedureMeta } from '@core/cli/api/meta'
import type { OpenApiMeta } from 'trpc-to-openapi'

export type ProcedureMeta = OpenApiMeta & CliProcedureMeta

const t = initTRPC.meta<ProcedureMeta>().create({
	isServer: true,
	transformer: superjson
})

export const p = t.procedure
export const r = t.router
