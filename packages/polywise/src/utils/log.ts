import { join } from 'path'
import { blueBright, cyanBright, gray, green, magentaBright, whiteBright, yellowBright } from 'ansis'
import dayjs from 'dayjs'
import { difference } from 'es-toolkit'
import { appendFileSync, ensureDirSync } from 'fs-extra'

import { app } from '../consts'

import type { Ansis } from 'ansis'

const stage_map: Record<string, Ansis> = {
	SQL: blueBright,
	PIPELINE: magentaBright,
	RANKING: yellowBright,
	SEARCH: cyanBright,
	SYSTEM: whiteBright
}

const enable_console = true
const enable_file = true
const allowed_stages = ['SQL', 'SAVE', 'PIPELINE', 'RANKING', 'SEARCH', 'SYSTEM'] as const
const exclude_stages = [] as Array<string>
const active_stages = difference(allowed_stages, exclude_stages)

export default (stage: (typeof allowed_stages)[number], message: string, getContext?: () => unknown) => {
	if (!enable_console && !enable_file) return
	if (!active_stages.includes(stage)) return

	const time_stamp = gray(dayjs().format('YYYY-MM-DD HH:mm:ss'))
	const color_fn = stage_map[stage] ?? whiteBright
	const stage_tag = color_fn(stage)
	const msg_content = green(message)

	let target_text = `[${time_stamp}] ${stage_tag}:${msg_content}`

	if (getContext) {
		target_text += gray(JSON.stringify(getContext()).slice(0, 100))
	}

	if (enable_console) {
		console.log(target_text)
	}

	if (!enable_file) return

	ensureDirSync(app.logs_dir)

	const log_path = join(app.logs_dir, `${dayjs().format('YYYY-MM-DD')}.log`)

	appendFileSync(log_path, `${target_text}\n`)
}
