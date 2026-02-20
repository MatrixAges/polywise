import { initTRPC } from '@trpc/server'

import type { BrowserWindow, Tray } from 'electron'
import type { ProcessArticleArgs, QueryArgs } from 'polywise'

type UpdateArgs = {
	memory_id: string
	content: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
	metadata?: Record<string, unknown>
}

type ForgetArgs = {
	memory_id?: string
	query?: string
	idol_id?: string
	root_ids?: Array<string>
	metrics_ids?: Array<string>
}

type SnapshotArgs = {
	weight_threshold?: number
}

type IdolArgs = {
	idol_id: string
}

type MemoryBridge = {
	save: (input: ProcessArticleArgs) => Promise<string>
	query: (input: QueryArgs) => Promise<unknown>
	update: (input: UpdateArgs) => Promise<string>
	forget: (input: ForgetArgs) => Promise<unknown>
	snapshot: (input: SnapshotArgs) => Promise<unknown>
	getNodes: () => Promise<unknown>
	getNodesByIdol: (input: IdolArgs) => Promise<unknown>
	getEdgesByIdol: (input: IdolArgs) => Promise<unknown>
}

const t = initTRPC
	.context<{
		win: BrowserWindow
		tray: Tray
		memory: MemoryBridge
	}>()
	.create({ isServer: true })

export const p = t.procedure
export const router = t.router
