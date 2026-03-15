import { initTRPC } from '@trpc/server'

import type { OpenApiMeta } from 'trpc-to-openapi'

const t = initTRPC.meta<OpenApiMeta>().create({
	isServer: true
})

export const p = t.procedure
export const r = t.router
