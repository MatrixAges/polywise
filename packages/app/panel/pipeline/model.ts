import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { PipelineList } from './types'

@injectable()
export default class Index {
	loading = true
	list = [] as PipelineList

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		await this.refresh()
		this.watch()
	}

	async refresh() {
		this.loading = true

		try {
			this.list = await rpc.pipeline.query.query()
		} finally {
			this.loading = false
		}
	}

	get running_list() {
		return this.list.filter(item => item.status === 'running')
	}

	get recent_list() {
		return this.list.filter(item => item.status !== 'running')
	}

	watch() {
		const deinit = rpc.pipeline.watch.subscribe(undefined, {
			onData: () => {
				void this.refresh()
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
