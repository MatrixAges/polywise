import { BookOpen, Bot, Brain, FolderGit2, Paperclip, TableOfContents, UserRound } from 'lucide-react'

import type { TFunction } from 'i18next'
import type { ListState, ListStateMap, PostListTab } from './types'

export const post_for_types = ['user', 'wiki', 'memory'] as const
export const post_list_tabs = ['wiki', 'memory', 'user', 'agent'] as const

export const createEmptyListState = (): ListState => ({
	list: [],
	page: 1,
	has_more: false,
	loading: false,
	inited: false,
	query: ''
})

export const createListStateMap = (): ListStateMap => ({
	agent: createEmptyListState(),
	user: createEmptyListState(),
	wiki: createEmptyListState(),
	memory: createEmptyListState()
})

export const mergePostList = <T extends { id: string }>(...lists: Array<Array<T>>) => {
	const result = [] as Array<T>
	const seen = new Set<string>()

	for (const list of lists) {
		for (const item of list) {
			if (seen.has(item.id)) {
				continue
			}

			seen.add(item.id)
			result.push(item)
		}
	}

	return result
}

export const parseOutline = (content: string) => {
	const lines = content.split('\n')
	const items = [] as Array<{ id: string; level: number; text: string }>

	for (const line of lines) {
		const match = /^(#{1,6})\s+(.+)$/.exec(line.trim())

		if (!match) {
			continue
		}

		items.push({
			id: `${items.length}-${match[2]}`,
			level: match[1].length,
			text: match[2]
		})
	}

	return items
}

export const normalizeHeadingText = (value: string) => value.replace(/\s+/g, ' ').trim()

export const isPostListTab = (value?: string | null): value is PostListTab =>
	typeof value === 'string' && post_list_tabs.includes(value as PostListTab)

export const getForTypeTabItems = (t: TFunction<'post'>) =>
	[
		{ key: 'wiki', title: t('tab.wiki'), Icon: BookOpen },
		{ key: 'memory', title: t('tab.memory'), Icon: Brain },
		{ key: 'user', title: t('tab.user'), Icon: UserRound },
		{ key: 'agent', title: t('tab.agent'), Icon: Bot }
	] as const

export const getDetailTabItems = (t: TFunction<'post'>) =>
	[
		{ key: 'outline', title: t('tab.outline'), Icon: TableOfContents },
		{ key: 'related', title: t('tab.related'), Icon: Paperclip },
		{ key: 'project', title: t('tab.project'), Icon: FolderGit2 }
	] as const
