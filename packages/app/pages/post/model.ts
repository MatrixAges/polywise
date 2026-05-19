import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import { createListStateMap, mergePostList, post_for_types } from './utils'

import type { MouseEvent as ReactMouseEvent } from 'react'
import type { PostForType, PostListItem } from './types'

@injectable()
export default class Index {
	for_type = 'user' as PostForType
	list_map = createListStateMap()
	menu_target_index = -1
	removing_post_id = ''
	extracting_post_id = ''
	search_map = {
		user: '',
		wiki: '',
		memory: ''
	} as Record<PostForType, string>
	search_timer = 0 as ReturnType<typeof setTimeout> | 0
	list_request_key_map = {
		user: '',
		wiki: '',
		memory: ''
	} as Record<PostForType, string>

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
		return this.list_map[this.for_type]
	}

	get current_search() {
		return this.search_map[this.for_type]
	}

	get menu_target_item() {
		return this.current_list_state.list[this.menu_target_index] ?? null
	}

	async init() {
		const deinit = setStorageWhenChange(
			[
				{
					for_type: {
						local_key: 'post_for_type',
						fromStorage: value =>
							post_for_types.includes(value as PostForType)
								? (value as PostForType)
								: 'user',
						toStorage: value =>
							post_for_types.includes(value as PostForType)
								? (value as PostForType)
								: 'user'
					}
				}
			],
			this
		)

		this.util.acts = [deinit]
		await this.ensureListLoaded(this.for_type)
	}

	deinit() {
		this.clearSearchTimer()
		this.util.deinit()
	}

	setForType(value: PostForType) {
		this.for_type = value
		this.menu_target_index = -1
		void this.ensureListLoaded(value)
	}

	setSearch(value: string) {
		this.search_map = {
			...this.search_map,
			[this.for_type]: value
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
			void this.loadList(this.for_type, 1, false)
		}, 220)
	}

	async ensureListLoaded(target_for_type: PostForType) {
		const current_state = this.list_map[target_for_type]
		const current_query = this.search_map[target_for_type].trim()

		if ((current_state.inited && current_state.query === current_query) || current_state.loading) {
			return
		}

		await this.loadList(target_for_type, 1, false)
	}

	async loadList(target_for_type: PostForType, page = 1, append = false) {
		const query = this.search_map[target_for_type].trim()
		const request_key = `${target_for_type}:${query}:${page}:${Date.now()}`

		this.list_request_key_map[target_for_type] = request_key
		this.list_map = {
			...this.list_map,
			[target_for_type]: {
				...this.list_map[target_for_type],
				loading: true
			}
		}

		try {
			const response = await rpc.post.query.query({
				page,
				for_type: target_for_type,
				query
			})

			if (this.list_request_key_map[target_for_type] !== request_key) {
				return
			}

			this.list_map = {
				...this.list_map,
				[target_for_type]: {
					list: append
						? mergePostList(this.list_map[target_for_type].list, response.list)
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
			if (this.list_request_key_map[target_for_type] !== request_key) {
				return
			}

			this.list_map = {
				...this.list_map,
				[target_for_type]: {
					...this.list_map[target_for_type],
					loading: false
				}
			}

			throw error
		}
	}

	async createPost() {
		const response = await rpc.post.create.mutate({
			for_type: this.for_type,
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

	updateListItem(target_for_type: PostForType, post_id: string, updater: (item: PostListItem) => PostListItem) {
		const current_state = this.list_map[target_for_type]
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
			[target_for_type]: {
				...current_state,
				list: next_list
			}
		}
	}

	removeListItem(target_for_type: PostForType, post_id: string) {
		const current_state = this.list_map[target_for_type]
		const next_list = current_state.list.filter(item => item.id !== post_id)

		if (next_list.length === current_state.list.length) {
			return
		}

		this.list_map = {
			...this.list_map,
			[target_for_type]: {
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

		const target_for_type = this.for_type
		this.removing_post_id = item.id

		try {
			await rpc.post.remove.mutate({ id: item.id })
			this.removeListItem(target_for_type, item.id)
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

		const target_for_type = this.for_type
		this.extracting_post_id = item.id

		try {
			const result = await rpc.post.extract.mutate({
				id: item.id,
				force: item.is_pipelined
			})

			if (!result.queued) {
				this.updateListItem(target_for_type, item.id, current => ({
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
