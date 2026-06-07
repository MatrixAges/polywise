import { Album, BookUser, Brain, Hash } from 'lucide-react'

export const getArticleTabItems = (t: (key: string, options?: Record<string, unknown>) => string) =>
	[
		{ key: 'wiki', title: t('tab.wiki', { ns: 'post' }), Icon: Hash },
		{ key: 'memory', title: t('tab.memory', { ns: 'post' }), Icon: Brain },
		{ key: 'user', title: t('tab.user', { ns: 'post' }), Icon: BookUser },
		{ key: 'linkcase', title: t('toolbar.link', { ns: 'linkcase' }), Icon: Album }
	] as const
