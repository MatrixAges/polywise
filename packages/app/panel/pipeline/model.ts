import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { PipelineList } from './types'

@injectable()
export default class Index {
	loading = true
	refreshing = false
	refresh_requested = false
	list = [] as PipelineList
	action_loading_map = {} as Record<string, 'cancel' | 'retry' | undefined>

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		await this.refresh()
		this.watch()
	}

	async refresh(args: { silent?: boolean } = {}) {
		const { silent = false } = args

		if (this.refreshing) {
			this.refresh_requested = true

			return
		}

		if (!silent && this.list.length === 0) {
			this.loading = true
		}

		this.refreshing = true

		try {
			this.list = await rpc.pipeline.query.query()
		} finally {
			this.refreshing = false
			this.loading = false

			if (this.refresh_requested) {
				this.refresh_requested = false
				void this.refresh({ silent: true })
			}
		}
	}

	get running_list() {
		return this.list.filter(item => item.status === 'running')
	}

	get queued_list() {
		return this.list.filter(item => item.status === 'queued')
	}

	get recent_list() {
		return this.list.filter(item => item.status !== 'running' && item.status !== 'queued')
	}

	isActionLoading(args: { article_id: string; action: 'cancel' | 'retry' }) {
		return this.action_loading_map[args.article_id] === args.action
	}

	async cancelTask(article_id: string) {
		if (this.isActionLoading({ article_id, action: 'cancel' })) {
			return
		}

		this.action_loading_map[article_id] = 'cancel'

		try {
			await rpc.pipeline.cancel.mutate({ article_id })
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to cancel pipeline task.')
		} finally {
			delete this.action_loading_map[article_id]
		}
	}

	async retryTask(article_id: string) {
		if (this.isActionLoading({ article_id, action: 'retry' })) {
			return
		}

		this.action_loading_map[article_id] = 'retry'

		try {
			await rpc.pipeline.retry.mutate({ article_id })
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to retry pipeline task.')
		} finally {
			delete this.action_loading_map[article_id]
		}
	}

	watch() {
		const deinit = rpc.pipeline.watch.subscribe(undefined, {
			onData: () => {
				void this.refresh({ silent: true })
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
