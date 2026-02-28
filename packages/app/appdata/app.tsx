import { Bookmark, Compass, Database, House, NotebookPen, SquareChartGantt } from 'lucide-react'

export const nav_icon_map = {
	bookmark: Bookmark,
	browser: Compass,
	notebook: NotebookPen
} as Record<string, typeof Bookmark>

export const nav_items = [
	{ key: 'home', Icon: House },
	{ key: 'bookmark', Icon: nav_icon_map['bookmark'] },
	{ key: 'browser', Icon: nav_icon_map['browser'] },
	{ key: 'notebook', Icon: nav_icon_map['notebook'] }
	// { key: 'database', Icon: Database },
	// { key: 'project', Icon: SquareChartGantt }
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
