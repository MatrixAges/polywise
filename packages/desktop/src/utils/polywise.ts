import { access } from 'fs/promises'
import { createRequire } from 'module'
import path from 'path'
import { app, utilityProcess } from 'electron'

import type { UtilityProcess } from 'electron'

const require = createRequire(__filename)
const server_base_url = 'http://127.0.0.1:3072'
const server_health_url = `${server_base_url}/api/version`
const startup_poll_interval_ms = 250
const startup_timeout_ms = 60_000
const shutdown_timeout_ms = 5_000
const log_history_limit = 30

const wait = async (ms: number) => {
	await new Promise(resolve => setTimeout(resolve, ms))
}

const isServerReady = async () => {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), 1500)

	try {
		const response = await fetch(server_health_url, {
			method: 'GET',
			signal: controller.signal
		})

		return response.ok
	} catch {
		return false
	} finally {
		clearTimeout(timer)
	}
}

const resolvePolywiseEntrypoint = async () => {
	if (app.isPackaged) {
		const package_dir = path.join(app.getAppPath(), 'node_modules', 'polywise')
		const entrypoint_path = path.join(package_dir, 'dist', 'index.js')

		try {
			await access(entrypoint_path)
		} catch {
			throw new Error(`Packaged Polywise entrypoint not found: ${entrypoint_path}`)
		}

		return {
			package_dir,
			entrypoint_path,
			spawn_cwd: package_dir
		}
	}

	const entrypoint_path = require.resolve('polywise')
	const package_dir = path.dirname(path.dirname(entrypoint_path))

	try {
		await access(entrypoint_path)
	} catch {
		throw new Error(`Polywise entrypoint not found: ${entrypoint_path}`)
	}

	return {
		package_dir,
		entrypoint_path,
		spawn_cwd: package_dir
	}
}

class PolywiseRuntime {
	private child: UtilityProcess | null = null
	private child_exit_code: number | null = null
	private started_by_desktop = false
	private log_history: Array<string> = []

	private pushLog(source: 'stdout' | 'stderr', chunk: Buffer | string) {
		const lines = String(chunk)
			.split(/\r?\n/g)
			.map(line => line.trim())
			.filter(Boolean)

		for (const line of lines) {
			const message = `[polywise:${source}] ${line}`

			this.log_history.push(message)

			if (this.log_history.length > log_history_limit) {
				this.log_history.splice(0, this.log_history.length - log_history_limit)
			}

			if (source === 'stderr') {
				console.error(message)
				continue
			}

			console.log(message)
		}
	}

	private getStartupErrorMessage() {
		const tail = this.log_history.slice(-8).join('\n')

		return tail ? `Polywise failed to start.\n${tail}` : 'Polywise failed to start.'
	}

	getStartupDiagnostics(error?: unknown) {
		const lines = [this.getStartupErrorMessage()]

		if (error instanceof Error) {
			lines.push(`Error: ${error.message}`)

			if (error.stack) {
				lines.push(error.stack)
			}
		} else if (error != null) {
			lines.push(`Error: ${String(error)}`)
		}

		return lines.join('\n\n')
	}

	async ensureStarted() {
		if (await isServerReady()) {
			this.started_by_desktop = false
			return
		}

		if (!this.child) {
			const { entrypoint_path, spawn_cwd } = await resolvePolywiseEntrypoint()

			this.log_history = []
			this.child_exit_code = null
			this.started_by_desktop = true
			this.child = utilityProcess.fork(entrypoint_path, ['--platform=electron'], {
				cwd: spawn_cwd,
				env: {
					...process.env,
					POLYWISE_PLATFORM: 'electron'
				},
				stdio: 'pipe',
				serviceName: 'Polywise Server',
				allowLoadingUnsignedLibraries: process.platform === 'darwin'
			})

			this.child.stdout?.on('data', chunk => {
				this.pushLog('stdout', chunk)
			})

			this.child.stderr?.on('data', chunk => {
				this.pushLog('stderr', chunk)
			})

			this.child.on('error', (type, location, report) => {
				this.pushLog('stderr', `${type}: ${location}`)

				if (report) {
					this.pushLog('stderr', report)
				}
			})

			this.child.on('exit', code => {
				this.child_exit_code = code
				console.log(`[polywise] process exited with code ${code}`)
			})
		}

		const deadline = Date.now() + startup_timeout_ms

		while (Date.now() < deadline) {
			if (await isServerReady()) {
				return
			}

			if (this.child && this.child_exit_code != null) {
				const exit_code = this.child_exit_code

				this.child = null
				this.child_exit_code = null

				throw new Error(`${this.getStartupErrorMessage()}\nExit code: ${exit_code}`)
			}

			await wait(startup_poll_interval_ms)
		}

		await this.stop()

		throw new Error(`${this.getStartupErrorMessage()}\nStartup timed out after ${startup_timeout_ms}ms.`)
	}

	async stop() {
		if (!this.started_by_desktop || !this.child) {
			this.child = null
			this.child_exit_code = null
			return
		}

		const child = this.child

		this.child = null
		this.child_exit_code = null
		this.started_by_desktop = false

		if (child.pid == null) {
			return
		}

		child.kill()

		const deadline = Date.now() + shutdown_timeout_ms

		while (Date.now() < deadline) {
			if (child.pid == null) {
				return
			}

			await wait(100)
		}

		if (child.pid != null) {
			process.kill(child.pid, 'SIGKILL')
		}
	}
}

export default new PolywiseRuntime()
