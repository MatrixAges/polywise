import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
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

	init(args: LogArgs) {
		const { dir, log, json } = args

		this.log_dir = dir ?? join(homedir(), '.polywise', 'log')
		this.enable_log = log ?? true
		this.enable_json = json ?? true

		if (!existsSync(this.log_dir)) {
			mkdirSync(this.log_dir, { recursive: true })
		}
	}

	write(input: Record<string, unknown>, output: Record<string, unknown>) {
		if (!this.log_dir) return

		const timestamp = this.getTimestamp()
		const date = this.getDate()

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

	private getTimestamp() {
		const now = new Date()
		const pad = (n: number) => String(n).padStart(2, '0')

		return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
	}

	private getDate() {
		const now = new Date()
		const pad = (n: number) => String(n).padStart(2, '0')

		return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
	}

	private writeLog(args: {
		timestamp: string
		input: Record<string, unknown>
		output: Record<string, unknown>
		date: string
	}) {
		const { timestamp, input, output, date } = args
		const content = `${timestamp} [INPUT]\n${JSON.stringify(input)}\n\n${timestamp} [OUTPUT]\n${JSON.stringify(output)}\n`
		const file_path = join(this.log_dir, `${date}.log`)

		writeFileSync(file_path, content, { flag: 'a' })
	}

	private writeJson(args: {
		timestamp: string
		input: Record<string, unknown>
		output: Record<string, unknown>
		date: string
	}) {
		const { timestamp, input, output, date } = args
		const entry = { timestamp, input, output }
		const file_path = join(this.log_dir, `${date}.json`)

		writeFileSync(file_path, JSON.stringify(entry) + '\n', { flag: 'a' })
	}
}
