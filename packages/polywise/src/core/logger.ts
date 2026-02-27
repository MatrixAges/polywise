import { join } from 'path'
import { blueBright, cyanBright, gray, green, magentaBright, whiteBright, yellowBright } from 'ansis'
import dayjs from 'dayjs'
import { difference } from 'es-toolkit'
import { exists, mkdir, writeFile } from 'fs-extra'
import { injectable } from 'tsyringe'

import { app } from '../consts'

import type { Ansis } from 'ansis'
import type { RequiredDeep } from 'type-fest'
import type { LoggerConfig, Stage } from '../types'

@injectable()
export default class Index {
	private config!: RequiredDeep<LoggerConfig>
	private stages: Array<Stage> = ['SQL', 'PIPELINE', 'RANKING', 'SEARCH', 'SYSTEM']

	async init(config?: LoggerConfig) {
		const { enable_console_log, enable_file_log, dir, exclude_stages } = config || {}

		this.config = config as RequiredDeep<LoggerConfig>
		this.config.enable_console_log = enable_console_log || false
		this.config.enable_file_log = enable_file_log || false
		this.config.dir = dir || app.default_logger_dir
		this.config.exclude_stages = difference(this.stages, exclude_stages || [])

		this.checkDir()
	}

	async checkDir() {
		const res = await exists(this.config.dir)

		if (res) return

		mkdir(this.config.dir, { recursive: true })
	}

	log(stage: Stage, message: string, getContext?: () => unknown) {
		const { enable_console_log, enable_file_log, dir } = this.config

		if (!enable_console_log && !enable_file_log) return

		if (!this.stages.includes(stage)) return

		const timestamp = gray(dayjs().format(app.default_timestamp_format))
		const stage_text = stage_color_map[stage](stage)
		const message_text = green(message)

		let target = `[${timestamp}] ${stage_text}:${message_text}`

		if (getContext) target += gray(JSON.stringify(getContext()).slice(0, 100))

		if (enable_console_log) {
			console.log(target)
		}

		if (enable_file_log) {
			const file_path = join(dir, `${dayjs().format(app.default_date_format)}.log`)

			writeFile(file_path, target, { flag: 'a' })
		}
	}
}

const stage_color_map: Record<Stage, Ansis> = {
	SQL: blueBright,
	PIPELINE: magentaBright,
	RANKING: yellowBright,
	SEARCH: cyanBright,
	SYSTEM: whiteBright
}
