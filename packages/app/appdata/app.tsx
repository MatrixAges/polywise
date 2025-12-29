import { Clipboard, FolderDown, House, NotebookPen, SquareMousePointer } from 'lucide-react'

export const nav_items = [
	{ key: 'home', Icon: House },
	{ key: 'writer', Icon: NotebookPen },
	{ key: 'canvas', Icon: Clipboard },
	{ key: 'importer', Icon: FolderDown },
	{ key: 'broswer', Icon: SquareMousePointer }
] as const
