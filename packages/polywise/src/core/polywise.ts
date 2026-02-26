import { PGlite } from '@electric-sql/pglite'
import { catchFinally } from 'shared'
import { container } from 'tsyringe'

import { app } from '../consts'
import { getPglite } from '../utils'
import Article from './article'
import Logger from './logger'
import Pipeline from './pipeline'

import type { Filters, PolywiseConfig, QueryArgs } from '../types'

const { resolve } = container

export default class Index {
	logger = resolve(Logger)
	pipeline = resolve(Pipeline)
	article = resolve(Article)

	config!: PolywiseConfig
	db!: PGlite

	async init(config: PolywiseConfig) {
		this.config = config
		this.config.filters = config.filters || {}

		await this.initPglite()
		await this.initLogger()
		await this.initPipeline()
	}

	private async initPglite() {
		this.db = await getPglite(this.config.data_dir || app.db.default_data_dir)
	}

	private async initLogger() {
		await this.logger.init(this.config.logger)
	}

	private async initPipeline() {
		await this.pipeline.init(this, this.config.pipeline)
	}

	@catchFinally<Index, any>(ctx => {
		ctx.brain.setBusy(false)
	})
	async query(args: QueryArgs) {
		// this.brain.reportUserActivity()
		// this.brain.setBusy(true)
		// const result = await this.cortex.process({
		// 	...args,
		// 	idol_id: args.idol_id ?? this.idol_id ?? undefined,
		// 	root_ids: args.root_ids ?? this.root_ids ?? undefined,
		// 	context_id: this.context_id ?? undefined,
		// 	process: args.process
		// })
		// args.process?.emit('final_result', result)
		// this.log.write(args, result)
		// return result
	}

	setFilters(args: Filters) {
		const { idol_id, root_ids, context_id } = args

		if (idol_id) this.config.filters!.idol_id = idol_id
		if (root_ids) this.config.filters!.root_ids = root_ids
		if (context_id) this.config.filters!.context_id = context_id
	}
}
