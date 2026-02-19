import { initTRPC } from '@trpc/server'

import type { BrowserWindow, Tray } from 'electron'
import type { Polywise, ProcessArticleArgs } from 'polywise'

const t = initTRPC
	.context<{
		win: BrowserWindow
		tray: Tray
		poly: Polywise
		saveMemory: (input: ProcessArticleArgs) => Promise<string>
	}>()
	.create({ isServer: true })

export const p = t.procedure
export const router = t.router
