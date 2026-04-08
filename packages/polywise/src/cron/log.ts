import path from 'path'
import { app } from '@core/consts'
import dayjs from 'dayjs'
import fs from 'fs-extra'

const cron_logs_dir = path.resolve(app.logs_dir, 'cron')

const sanitizeLogText = (v: string) => v.replace(/\n/g, ' ')

export default async (name: string, stage: 'trigger' | 'success' | 'error' | 'system', message: string) => {
	await fs.ensureDir(cron_logs_dir)

	const date_text = dayjs().format('YYYY-MM-DD')
	const time_text = dayjs().format('YYYY-MM-DD HH:mm:ss')
	const log_path = path.resolve(cron_logs_dir, `${date_text}.log`)
	const line = `[${time_text}] [${name}] [${stage}] ${sanitizeLogText(message)}\n`

	await fs.appendFile(log_path, line, 'utf8')
}
