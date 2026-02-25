import { initTRPC } from '@trpc/server'

import type { BrowserWindow, Tray } from 'electron'
import type { GetNodeRelatedArgs, ProcessArticleArgs, QueryArgs } from 'polywise'

type UpdateArgs = {
	memory_id: string
	content: string
	idol_id?: string
	root_ids?: Array<string>
	metadata?: Record<string, unknown>
}

type ForgetArgs = {
	memory_id?: string
	query?: string
	idol_id?: string
	root_ids?: Array<string>
}

type SnapshotArgs = {
	weight_threshold?: number
	limit?: number
}

type RecallArgs = {
	query: string
	max_depth?: number
	idol_id?: string
	root_ids?: Array<string>
	limit?: number
}

type MemoryBridge = {
	save: (input: ProcessArticleArgs) => Promise<string>
	query: (input: QueryArgs) => Promise<unknown>
	update: (input: UpdateArgs) => Promise<string>
	forget: (input: ForgetArgs) => Promise<unknown>
	snapshot: (input: SnapshotArgs) => Promise<unknown>
	recall: (input: RecallArgs) => Promise<unknown>
	getNodeRelated: (input: GetNodeRelatedArgs) => Promise<unknown>
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
