import { Compass, Database, FolderInput, House, NotebookPen, SquareChartGantt } from 'lucide-react'

export const nav_items = [
	{ key: 'home', Icon: House },
	{ key: 'importer', Icon: FolderInput },
	{ key: 'broswer', Icon: Compass },
	{ key: 'notebook', Icon: NotebookPen },
	{ key: 'database', Icon: Database },
	{ key: 'project', Icon: SquareChartGantt }
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
