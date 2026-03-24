import { Bookmark, Bot, Compass, Database, Folders, House, NotebookPen, Search } from 'lucide-react'

import { is_electron } from '@/utils/is'

export const nav_items = [
	{ key: '', Icon: House, title: 'home' },
	{ key: 'search', Icon: Search },
	{ key: 'agent', Icon: Bot },
	{ key: 'bookmark', Icon: Bookmark },
	{ key: 'notebook', Icon: NotebookPen },
	{ key: 'database', Icon: Database },
	{ key: 'project', Icon: Folders },
	is_electron && { key: 'browser', Icon: Compass }
].filter(Boolean) as Array<{ key: string; Icon: typeof Search; title?: string }>

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
	embedding: { name: 'Embedding Model', model: 'Qwen3 Embedding 0.6B' },
	rerank: { name: 'Rerank Model', model: 'Qwen3 Reranker 0.6B' },
	gen: { name: 'Generation Model', model: 'Qwen3.5 4B' }
} as Record<string, { name: string; model: string }>

export const server_base_url = 'http://localhost:3072'
export const server_sys_url = server_base_url + '/sys'
export const server_sys_session_url = server_sys_url + '/session'
export const server_trpc_url = server_base_url + '/trpc'
