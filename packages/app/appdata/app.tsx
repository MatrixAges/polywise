import {
	Album,
	AppWindowMac,
	Bot,
	CircleCheckBig,
	Database,
	House,
	Library,
	MessageCircleCheck,
	Route,
	ScrollText
} from 'lucide-react'

import { is_electron } from '@/utils/is'

import type { LucideIcon } from 'lucide-react'

export const nav_items = [
	{ key: '', Icon: House, title: 'home' },
	// { key: 'todo', Icon: CircleCheckBig },
	{ key: 'session', Icon: MessageCircleCheck },
	// { key: 'workflow', Icon: Route },
	{ key: 'agent', Icon: Bot },
	{ key: 'linkcase', Icon: Album },
	{ key: 'post', Icon: ScrollText }
	// { key: 'library', Icon: Library },
	// { key: 'database', Icon: Database },
	// is_electron && { key: 'browser', Icon: AppWindowMac },
].filter(Boolean) as Array<{ key: string; Icon: LucideIcon; title?: string }>

export const locales = ['en', 'zh-cn'] as const

export const locale_options = [
	{
		label: 'English',
		value: 'en'
	},
	{
		label: '简体中文',
		value: 'zh-cn'
	}
]

export const themes = ['light', 'dark', 'system'] as const

export const local_models = {
	embedding: { name: 'Embedding Model', model: 'Qwen3 Embedding 0.6B', size: '639.2MB' },
	rerank: { name: 'Rerank Model', model: 'Qwen3 Reranker 0.6B', size: '639.2MB' },
	gen: { name: 'Generation Model', model: 'Qwen3.5 4B', size: '5.95GB' }
} as Record<string, { name: string; model: string; size: string }>

export const server_base_url = 'http://localhost:3072'
export const server_sys_url = server_base_url + '/sys'
export const server_sys_session_url = server_sys_url + '/session'
export const server_trpc_url = server_base_url + '/trpc'
export const server_ws_url = 'ws://localhost:3072/trpc'
