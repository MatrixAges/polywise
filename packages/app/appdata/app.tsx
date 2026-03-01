import { Bookmark, Bot, Compass, Database, Folders, NotebookPen, Search } from 'lucide-react'

export const nav_items = [
	{ key: '', Icon: Search, title: 'search' },
	{ key: 'agent', Icon: Bot },
	{ key: 'bookmark', Icon: Bookmark },
	{ key: 'notebook', Icon: NotebookPen },
	{ key: 'database', Icon: Database },
	{ key: 'project', Icon: Folders },
	{ key: 'browser', Icon: Compass }
] as Array<{ key: string; Icon: typeof Search; title?: string }>

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
