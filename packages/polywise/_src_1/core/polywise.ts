import { PGlite } from '@electric-sql/pglite'
import { catchFinally } from 'shared'
import { container } from 'tsyringe'

import { app } from '../consts'
import { getPglite, setDbScopes } from '../utils'
import Article from './article'
import Brain from './brain'
import Context from './context'
import Logger from './logger'
import Pipeline from './pipeline'

import type { PolywiseConfig, QueryArgs } from '../types'

const { resolve } = container

export default class Index {
	logger = resolve(Logger)
	pipeline = resolve(Pipeline)
	article = resolve(Article)
	brain = resolve(Brain)
	context = resolve(Context)

	config!: PolywiseConfig
	db!: PGlite

	async init(config: PolywiseConfig) {
		this.config = config
		this.config.scopes = config.scopes || {}

		await this.initPglite()
		await this.initLogger()
		await this.initPipeline()

		this.brain.init(this)
		this.context.init(this)
	}

	private async initPglite() {
		this.db = await getPglite(this.config.data_dir || app.default_data_dir)

		await setDbScopes(this.db, this.config.scopes!)
	}

	private async initLogger() {
		await this.logger.init(this.config.logger)
	}

	private async initPipeline() {
		await this.pipeline.init(this, this.config.pipeline)
	}

	@catchFinally<Index>(ctx => ctx.brain.setBusy(false))
	async query(args: QueryArgs) {}
}
