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
