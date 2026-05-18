import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import { createListStateMap, mergePostList } from './shared'

import type { PostForType } from './shared'

@injectable()
export default class Index {
	for_type = 'user' as PostForType
	list_map = createListStateMap()

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	get current_list_state() {
		return this.list_map[this.for_type]
	}

	async init() {
		await this.ensureListLoaded(this.for_type)
	}

	deinit() {
		this.util.deinit()
	}

	setForType(value: PostForType) {
		this.for_type = value
		void this.ensureListLoaded(value)
	}

	async ensureListLoaded(target_for_type: PostForType) {
		const current_state = this.list_map[target_for_type]

		if (current_state.inited || current_state.loading) {
			return
		}

		await this.loadList(target_for_type, 1, false)
	}

	async loadList(target_for_type: PostForType, page = 1, append = false) {
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
				for_type: target_for_type
			})

			this.list_map = {
				...this.list_map,
				[target_for_type]: {
					list: append
						? mergePostList(this.list_map[target_for_type].list, response.list)
						: response.list,
					page,
					has_more: response.has_more,
					loading: false,
					inited: true
				}
			}
		} catch (error) {
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
