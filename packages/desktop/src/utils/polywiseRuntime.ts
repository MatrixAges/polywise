import { fork, spawnSync } from 'child_process'
import { access } from 'fs/promises'
import { createRequire } from 'module'
import path from 'path'

import type { ChildProcess } from 'child_process'

const require = createRequire(__filename)
const server_base_url = 'http://127.0.0.1:3072'
const server_health_url = `${server_base_url}/api/version`
const startup_poll_interval_ms = 250
const startup_timeout_ms = 60_000
const shutdown_timeout_ms = 5_000
const log_history_limit = 30
const node_exec_env_keys = ['POLYWISE_NODE_EXEC_PATH', 'npm_node_execpath', 'NODE']

const wait = async (ms: number) => {
	await new Promise(resolve => setTimeout(resolve, ms))
}

const isChildExited = (child: ChildProcess) => child.exitCode != null || child.signalCode != null

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
	const entrypoint_path = require.resolve('polywise')
	const package_dir = path.dirname(path.dirname(entrypoint_path))

	try {
		await access(entrypoint_path)
	} catch {
		throw new Error(`Polywise entrypoint not found: ${entrypoint_path}`)
	}

	return {
		package_dir,
		entrypoint_path
	}
}

const resolveNodeExecPath = async () => {
	for (const key of node_exec_env_keys) {
		const value = process.env[key]?.trim()

		if (!value) continue

		try {
			await access(value)
			return value
		} catch {}
	}

	const command = process.platform === 'win32' ? 'where' : 'which'
	const result = spawnSync(command, ['node'], {
		encoding: 'utf8',
		shell: false,
		env: process.env
	})
	const candidate = result.stdout
		.split(/\r?\n/g)
		.map(line => line.trim())
		.find(Boolean)

	if (candidate) {
		try {
			await access(candidate)
			return candidate
		} catch {}
	}

	throw new Error(
		'Unable to resolve a standalone Node.js executable for polywise runtime. Set POLYWISE_NODE_EXEC_PATH if needed.'
	)
}

class PolywiseRuntime {
	private child: ChildProcess | null = null
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

	async ensureStarted() {
		if (await isServerReady()) {
			this.started_by_desktop = false
			return
		}

		if (!this.child) {
			const { entrypoint_path, package_dir } = await resolvePolywiseEntrypoint()
			const node_exec_path = await resolveNodeExecPath()

			this.log_history = []
			this.started_by_desktop = true
			this.child = fork(entrypoint_path, ['--platform=electron'], {
				cwd: package_dir,
				execPath: node_exec_path,
				env: {
					...process.env,
					POLYWISE_PLATFORM: 'electron'
				},
				silent: true
			})

			this.child.stdout?.on('data', chunk => {
				this.pushLog('stdout', chunk)
			})

			this.child.stderr?.on('data', chunk => {
				this.pushLog('stderr', chunk)
			})

			this.child.on('error', error => {
				this.pushLog('stderr', error.message)
			})

			this.child.on('exit', code => {
				console.log(`[polywise] process exited with code ${code ?? 'null'}`)
			})
		}

		const deadline = Date.now() + startup_timeout_ms

		while (Date.now() < deadline) {
			if (await isServerReady()) {
				return
			}

			if (this.child && isChildExited(this.child)) {
				const child = this.child

				this.child = null

				throw new Error(
					`${this.getStartupErrorMessage()}\nExit code: ${child.exitCode}, signal: ${child.signalCode}`
				)
			}

			await wait(startup_poll_interval_ms)
		}

		await this.stop()

		throw new Error(`${this.getStartupErrorMessage()}\nStartup timed out after ${startup_timeout_ms}ms.`)
	}

	async stop() {
		if (!this.started_by_desktop || !this.child) {
			this.child = null
			return
		}

		const child = this.child

		this.child = null
		this.started_by_desktop = false

		if (isChildExited(child)) {
			return
		}

		child.kill('SIGTERM')

		const deadline = Date.now() + shutdown_timeout_ms

		while (Date.now() < deadline) {
			if (isChildExited(child)) {
				return
			}

			await wait(100)
		}

		child.kill('SIGKILL')
	}
}

export default new PolywiseRuntime()
