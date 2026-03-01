import { Bookmark, Bot, Compass, Database, Folders, NotebookPen, Search } from 'lucide-react'

export const nav_items = [
	{ key: 'search', Icon: Search },
	{ key: 'agent', Icon: Bot },
	{ key: 'bookmark', Icon: Bookmark },
	{ key: 'browser', Icon: Compass },
	{ key: 'notebook', Icon: NotebookPen },
	{ key: 'database', Icon: Database },
	{ key: 'project', Icon: Folders }
] as const

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
