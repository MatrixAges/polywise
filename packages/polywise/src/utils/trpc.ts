import { initTRPC } from '@trpc/server'

const t = initTRPC.create({ isServer: true })

export const p = t.procedure
export const r = t.router
