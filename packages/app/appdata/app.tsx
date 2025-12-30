import { Clipboard, FolderInput, House, NotebookPen, SquareMousePointer } from 'lucide-react'

export const nav_items = [
	{ key: 'home', Icon: House },
	{ key: 'writer', Icon: NotebookPen },
	{ key: 'canvas', Icon: Clipboard },
	{ key: 'importer', Icon: FolderInput },
	{ key: 'broswer', Icon: SquareMousePointer }
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
