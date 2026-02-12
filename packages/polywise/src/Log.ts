import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import dayjs from 'dayjs'
import { injectable } from 'tsyringe'

import { DEFAULT_DATE_FORMAT, DEFAULT_TIMESTAMP_FORMAT, formatLogEntry } from './consts'

import type { LogArgs, WriteLogArgs } from './types'

@injectable()
export default class Log {
	private log_dir = join(homedir(), '.polywise', 'log')
	private enable_log = false
	private enable_json = false
	private today_logs: Array<string> = []

	init(args: LogArgs) {
		const { dir, log, json } = args

		if (dir) this.log_dir = dir

		this.enable_log = log ?? false
		this.enable_json = json ?? false

		if (!existsSync(this.log_dir)) {
			mkdirSync(this.log_dir, { recursive: true })
		}
	}

	write(input: object, output: object) {
		if (!this.enable_log) return

		const now = dayjs()
		const timestamp = now.format(DEFAULT_TIMESTAMP_FORMAT)
		const date = now.format(DEFAULT_DATE_FORMAT)
		const log_entry = formatLogEntry(timestamp, input, output)

		this.today_logs.push(log_entry)

		if (this.enable_json) {
			this.writeJson({
				timestamp,
				input,
				output,
				date
			})
		} else {
			this.writeLog({
				timestamp,
				input,
				output,
				date
			})
		}
	}

	getTodayLogs() {
		const logs = [...this.today_logs]

		this.today_logs = []

		return logs
	}

	private writeLog(args: WriteLogArgs) {
		const { timestamp, input, output, date } = args
		const content = formatLogEntry(timestamp, input, output)

		const file_path = join(this.log_dir, `${date}.log`)

		writeFileSync(file_path, content, { flag: 'a' })
	}

	private writeJson(args: WriteLogArgs) {
		const { timestamp, input, output, date } = args
		const entry = { timestamp, input, output }

		const file_path = join(this.log_dir, `${date}.json`)

		writeFileSync(file_path, JSON.stringify(entry) + '\n', { flag: 'a' })
	}
}
