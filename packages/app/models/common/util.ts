import { makeAutoObservable } from 'mobx'

import type { IReactionDisposer, Lambda } from 'mobx'

export default class Index {
	acts = [] as Array<IReactionDisposer | Lambda>
	loading = {} as Record<string, boolean>

	constructor() {
		makeAutoObservable(this, { acts: false }, { autoBind: true })
	}

	off() {
		this.acts.map(item => item())
		this.acts = []
	}
}
