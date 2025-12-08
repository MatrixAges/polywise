import { initTRPC } from '@trpc/server'

import type { BrowserWindow, Tray } from 'electron'

const t = initTRPC.context<{ win: BrowserWindow; tray: Tray }>().create({ isServer: true })

export const p = t.procedure
export const router = t.router
