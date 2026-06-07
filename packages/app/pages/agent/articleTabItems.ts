import { Album, BookUser, Brain, Hash } from 'lucide-react'

import type { TFunction } from 'i18next'

export const getArticleTabItems = (t: TFunction<readonly ['agent', 'post', 'linkcase']>) =>
	[
		{ key: 'wiki', title: t('tab.wiki', { ns: 'post' }), Icon: Hash },
		{ key: 'memory', title: t('tab.memory', { ns: 'post' }), Icon: Brain },
		{ key: 'user', title: t('tab.user', { ns: 'post' }), Icon: BookUser },
		{ key: 'linkcase', title: t('tab.linkcase', { ns: 'post' }), Icon: Album }
	] as const
