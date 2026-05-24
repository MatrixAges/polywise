import { Album, BookUser, Brain, Hash } from 'lucide-react'

export const article_tab_items = [
	{ key: 'wiki', title: 'wiki', Icon: Hash },
	{ key: 'memory', title: 'memory', Icon: Brain },
	{ key: 'user', title: 'user', Icon: BookUser },
	{ key: 'linkcase', title: 'linkcase', Icon: Album }
] as const
