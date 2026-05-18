import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import { createListStateMap, mergePostList, post_for_types } from './utils'

import type { PostForType } from './types'

@injectable()
export default class Index {
	for_type = 'user' as PostForType
	list_map = createListStateMap()
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
}
