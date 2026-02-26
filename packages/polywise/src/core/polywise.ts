import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { catchFinally } from 'shared'
import { container, singleton } from 'tsyringe'

import { app } from '../consts'
import Logger from './logger'
import Pipeline from './pipeline'

import type { PolywiseConfig, QueryArgs } from '../types'

const { resolve } = container

@singleton()
export default class Index {
	logger = resolve(Logger)
	pipeline = resolve(Pipeline)

	config!: PolywiseConfig
	db!: PGlite

	async init(config: PolywiseConfig) {
		this.config = config

		await this.initPglite()
		await this.initLogger()
		await this.initPipeline()
	}

	private async initPglite() {
		this.db = await PGlite.create(this.config.data_dir || app.db.default_data_dir, {
			relaxedDurability: true,
			extensions: { vector }
		})
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
}
