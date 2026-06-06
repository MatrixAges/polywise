import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import { createListStateMap, isPostListTab, mergePostList } from './utils'

import type { MouseEvent as ReactMouseEvent } from 'react'
import type { PostListItem, PostListTab } from './types'

@injectable()
export default class Index {
	active_tab = 'wiki' as PostListTab
	list_map = createListStateMap()
	menu_target_index = -1
	removing_post_id = ''
	extracting_post_id = ''
	search_map = {
		agent: '',
		user: '',
		wiki: '',
		memory: ''
	} as Record<PostListTab, string>
	search_timer = 0 as ReturnType<typeof setTimeout> | 0
	list_request_key_map = {
		agent: '',
		user: '',
		wiki: '',
		memory: ''
	} as Record<PostListTab, string>

	constructor(public util: Util) {
		makeAutoObservable(
			this,
			{
				util: false,
				search_timer: false,
				list_request_key_map: false
			},
			{ autoBind: true }
		)
	}

	get current_list_state() {
		return this.list_map[this.active_tab]
	}

	get current_search() {
		return this.search_map[this.active_tab]
	}

	get current_post_for_type() {
		return this.active_tab === 'agent' ? 'wiki' : this.active_tab
	}

	get menu_target_item() {
		return this.current_list_state.list[this.menu_target_index] ?? null
	}

	async init() {
		const deinit = setStorageWhenChange(
			[
				{
					active_tab: {
						local_key: 'post_for_type',
						fromStorage: value =>
							isPostListTab(value as PostListTab) ? (value as PostListTab) : 'user',
						toStorage: value =>
							isPostListTab(value as PostListTab) ? (value as PostListTab) : 'user'
					}
				}
			],
			this
		)

		this.util.acts = [deinit]
		await this.ensureListLoaded(this.active_tab)
	}

	deinit() {
		this.clearSearchTimer()
		this.util.deinit()
	}

	setForType(value: PostListTab) {
		this.active_tab = value
		this.menu_target_index = -1
		void this.ensureListLoaded(value)
	}

	setSearch(value: string) {
		this.search_map = {
			...this.search_map,
			[this.active_tab]: value
		}
		this.scheduleSearch()
	}

	clearSearchTimer() {
		if (this.search_timer) {
			clearTimeout(this.search_timer)
			this.search_timer = 0
		}
	}

	scheduleSearch() {
		this.clearSearchTimer()

		this.search_timer = setTimeout(() => {
			this.menu_target_index = -1
			void this.loadList(this.active_tab, 1, false)
		}, 220)
	}

	async ensureListLoaded(target_tab: PostListTab) {
		const current_state = this.list_map[target_tab]
		const current_query = this.search_map[target_tab].trim()

		if ((current_state.inited && current_state.query === current_query) || current_state.loading) {
			return
		}

		await this.loadList(target_tab, 1, false)
	}

	async loadList(target_tab: PostListTab, page = 1, append = false) {
		const query = this.search_map[target_tab].trim()
		const request_key = `${target_tab}:${query}:${page}:${Date.now()}`

		this.list_request_key_map[target_tab] = request_key
		this.list_map = {
			...this.list_map,
			[target_tab]: {
				...this.list_map[target_tab],
				loading: true
			}
		}

		try {
			const response = await rpc.post.query.query({
				page,
				tab: target_tab,
				for_type: target_tab === 'agent' ? undefined : target_tab,
				query
			})

			if (this.list_request_key_map[target_tab] !== request_key) {
				return
			}

			this.list_map = {
				...this.list_map,
				[target_tab]: {
					list: append
						? mergePostList(this.list_map[target_tab].list, response.list)
						: response.list,
					page,
					query,
					has_more: response.has_more,
					loading: false,
					inited: true
				}
			}
			this.menu_target_index = -1
		} catch (error) {
			if (this.list_request_key_map[target_tab] !== request_key) {
				return
			}

			this.list_map = {
				...this.list_map,
				[target_tab]: {
					...this.list_map[target_tab],
					loading: false
				}
			}

			throw error
		}
	}

	async createPost() {
		const response = await rpc.post.create.mutate({
			for_type: this.current_post_for_type,
			title: '',
			content: ''
		})

		return response?.id ?? ''
	}

	findMenuTarget(target: EventTarget | null) {
		let current_node = target instanceof HTMLElement ? target : null

		while (current_node) {
			const value = current_node.getAttribute('data-index')

			if (value !== null) {
				const index = Number(value)

				return Number.isNaN(index) ? -1 : index
			}

			current_node = current_node.parentElement
		}

		return -1
	}

	onListContextCapture(event: ReactMouseEvent<HTMLDivElement>) {
		const next_index = this.findMenuTarget(event.target)

		if (next_index < 0) {
			this.menu_target_index = -1
			event.preventDefault()

			return
		}

		this.menu_target_index = next_index
	}

	updateListItem(target_tab: PostListTab, post_id: string, updater: (item: PostListItem) => PostListItem) {
		const current_state = this.list_map[target_tab]
		let changed = false
		const next_list = current_state.list.map(item => {
			if (item.id !== post_id) {
				return item
			}

			changed = true

			return updater(item)
		})

		if (!changed) {
			return
		}

		this.list_map = {
			...this.list_map,
			[target_tab]: {
				...current_state,
				list: next_list
			}
		}
	}

	removeListItem(target_tab: PostListTab, post_id: string) {
		const current_state = this.list_map[target_tab]
		const next_list = current_state.list.filter(item => item.id !== post_id)

		if (next_list.length === current_state.list.length) {
			return
		}

		this.list_map = {
			...this.list_map,
			[target_tab]: {
				...current_state,
				list: next_list
			}
		}
	}

	async removePost(item: PostListItem) {
		if (this.removing_post_id || this.extracting_post_id) {
			return
		}

		if (!window.confirm(`Delete post "${item.title || 'Untitled'}"?`)) {
			return
		}

		const target_tab = this.active_tab
		this.removing_post_id = item.id

		try {
			await rpc.post.remove.mutate({ id: item.id })
			this.removeListItem(target_tab, item.id)
			this.menu_target_index = -1
			toast.success('Post removed.')
		} finally {
			if (this.removing_post_id === item.id) {
				this.removing_post_id = ''
			}
		}
	}

	async extractPost(item: PostListItem) {
		if (this.extracting_post_id || this.removing_post_id) {
			return
		}

		const target_tab = this.active_tab
		this.extracting_post_id = item.id

		try {
			const result = await rpc.post.extract.mutate({
				id: item.id,
				force: item.is_pipelined
			})

			if (!result.queued) {
				this.updateListItem(target_tab, item.id, current => ({
					...current,
					is_pipelined: true
				}))
			}

			toast.success(result.queued ? 'Extract queued.' : 'Extract completed.')
		} finally {
			if (this.extracting_post_id === item.id) {
				this.extracting_post_id = ''
			}
		}
	}
}
