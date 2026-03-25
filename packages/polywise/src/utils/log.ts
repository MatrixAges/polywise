import { appendFileSync } from 'fs'
import { join } from 'path'
import { blueBright, cyanBright, gray, green, magentaBright, whiteBright, yellowBright } from 'ansis'
import dayjs from 'dayjs'
import { difference } from 'es-toolkit'
import { ensureDirSync } from 'fs-extra/esm'

import { app } from '../consts'

import type { Ansis } from 'ansis'

type LogStage = 'SQL' | 'SAVE' | 'PIPELINE' | 'RANKING' | 'SEARCH' | 'SYSTEM' | 'TASK_QUEUE' | 'CONFIG'

const stage_map: Record<string, Ansis> = {
	SQL: blueBright,
	PIPELINE: magentaBright,
	RANKING: yellowBright,
	SEARCH: cyanBright,
	SYSTEM: whiteBright,
	SAVE: green,
	TASK_QUEUE: cyanBright
}

const disabled = true
const enable_console = true
const enable_file = true
const allowed_stages: Array<LogStage> = [
	'SQL',
	'SAVE',
	'PIPELINE',
	'RANKING',
	'SEARCH',
	'SYSTEM',
	'TASK_QUEUE',
	'CONFIG'
]
const exclude_stages: Array<string> = []
const active_stages = difference(allowed_stages, exclude_stages)

export default (stage: LogStage, message: string, getContext?: () => unknown) => {
	const is_active = active_stages.includes(stage)

	if (disabled) return
	if ((!enable_console && !enable_file) || !is_active) return

	const time_now = dayjs().format('YYYY-MM-DD HH:mm:ss')
	const extra_info = getContext ? '\n' + JSON.stringify(getContext()) : ''

	if (enable_console) {
		const color_fn = stage_map[stage] ?? whiteBright
		const console_msg = `[${gray(time_now)}] ${color_fn(stage)}:${green(message)} ${gray(extra_info)}`

		console.log(console_msg)
	}

	if (!enable_file) return

	ensureDirSync(app.logs_dir)

	const log_path = join(app.logs_dir, `${dayjs().format('YYYY-MM-DD HH')}.log`)
	const file_content = `[${time_now}] ${stage}:${message}${extra_info}\n------\n`

	appendFileSync(log_path, file_content)
}
