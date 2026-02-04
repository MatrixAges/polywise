import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import dayjs from 'dayjs'
import { injectable } from 'tsyringe'

export interface LogArgs {
	dir?: string
	log?: boolean
	json?: boolean
}

@injectable()
export default class Log {
	private log_dir: string = ''
	private enable_log: boolean = true
	private enable_json: boolean = true
	private today_logs: string[] = []

	init(args: LogArgs) {
		const { dir, log, json } = args

		this.log_dir = dir ?? join(homedir(), '.polywise', 'log')
		this.enable_log = log ?? true
		this.enable_json = json ?? true

		if (!existsSync(this.log_dir)) {
			mkdirSync(this.log_dir, { recursive: true })
		}
	}

	write(input: object, output: object) {
		const now = dayjs()
		const timestamp = now.format('YYYY-MM-DD HH:mm:ss')
		const date = now.format('YYYY-MM-DD')

		const log_entry = `${timestamp} [INPUT]\n${JSON.stringify(input)}\n\n${timestamp} [OUTPUT]\n${JSON.stringify(output)}\n`
		this.today_logs.push(log_entry)

		if (!this.log_dir) return

		if (this.enable_log) {
			this.writeLog({
				timestamp,
				input,
				output,
				date
			})
		}

		if (this.enable_json) {
			this.writeJson({
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

	private writeLog(args: { timestamp: string; input: object; output: object; date: string }) {
		const { timestamp, input, output, date } = args
		const content = `${timestamp} [INPUT]\n${JSON.stringify(input)}\n\n${timestamp} [OUTPUT]\n${JSON.stringify(output)}\n`
		const file_path = join(this.log_dir, `${date}.log`)

		writeFileSync(file_path, content, { flag: 'a' })
	}

	private writeJson(args: { timestamp: string; input: object; output: object; date: string }) {
		const { timestamp, input, output, date } = args
		const entry = { timestamp, input, output }
		const file_path = join(this.log_dir, `${date}.json`)

		writeFileSync(file_path, JSON.stringify(entry) + '\n', { flag: 'a' })
	}

	off() {}
}
