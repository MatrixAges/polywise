import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { HomeSnapshot } from './types'

@injectable()
export default class Index {
	loading = false
	snapshot = null as HomeSnapshot | null
	last_loaded_at = 0

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init() {
		void this.refresh()
	}

	async refresh() {
		this.loading = true

		try {
			this.snapshot = await rpc.home.query.query()
			this.last_loaded_at = Date.now()
		} finally {
			this.loading = false
		}
	}

	deinit() {}
}
