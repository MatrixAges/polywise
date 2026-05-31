import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import path from 'path'
import { app, utilityProcess } from 'electron'
import fs from 'fs-extra'

import type { UtilityProcess } from 'electron'

const require = createRequire(__filename)
const server_base_url = 'http://127.0.0.1:3072'
const server_health_url = `${server_base_url}/api/version`
const startup_poll_interval_ms = 250
const startup_timeout_ms = 60_000
const shutdown_timeout_ms = 5_000
const log_history_limit = 30
const desktop_cli_marker = 'polywise-managed-by-desktop'
const cli_command_name = process.platform === 'win32' ? 'polywise.cmd' : 'polywise'

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

const normalizePathForCompare = (file_path: string) =>
	process.platform === 'win32' ? file_path.toLowerCase() : file_path

const quoteShellPath = (file_path: string) => `"${file_path.replace(/["\\$`]/g, '\\$&')}"`

const quoteCmdPath = (file_path: string) => `"${file_path.replace(/"/g, '""')}"`

const isManagedCliWrapper = (content: string) => content.includes(desktop_cli_marker)

const renderCliWrapperContent = (exec_path: string, cli_entrypoint_path: string) => {
	if (process.platform === 'win32') {
		return [
			'@echo off',
			`rem ${desktop_cli_marker}`,
			'set "POLYWISE_DESKTOP_CLI=1"',
			`${quoteCmdPath(exec_path)} ${quoteCmdPath(cli_entrypoint_path)} %*`,
			''
		].join('\r\n')
	}

	return [
		'#!/bin/sh',
		`# ${desktop_cli_marker}`,
		`POLYWISE_DESKTOP_CLI=1 exec ${quoteShellPath(exec_path)} ${quoteShellPath(cli_entrypoint_path)} "$@"`,
		''
	].join('\n')
}

const getGlobalBinDir = () => {
	const npm_prefix = spawnSync('npm', ['prefix', '-g'], {
		encoding: 'utf8',
		shell: false,
		env: process.env
	})

	if (npm_prefix.error || npm_prefix.status !== 0) {
		return null
	}

	const prefix = npm_prefix.stdout.trim()

	if (!prefix) {
		return null
	}

	return process.platform === 'win32' ? prefix : path.join(prefix, 'bin')
}

const resolveExistingPolywiseCommandPath = () => {
	if (process.platform === 'win32') {
		const result = spawnSync('where', ['polywise'], {
			encoding: 'utf8',
			shell: false,
			env: process.env
		})

		if (result.error || result.status !== 0) {
			return null
		}

		return result.stdout
			.split(/\r?\n/g)
			.map(line => line.trim())
			.find(Boolean)
	}

	const shell = process.env.SHELL ?? '/bin/sh'
	const result = spawnSync(shell, ['-lc', 'command -v polywise'], {
		encoding: 'utf8',
		shell: false,
		env: process.env
	})

	if (result.error || result.status !== 0) {
		return null
	}

	return result.stdout.trim() || null
}

const resolvePolywisePaths = async () => {
	if (app.isPackaged) {
		const package_dir = path.join(app.getAppPath(), 'node_modules', 'polywise')
		const entrypoint_path = path.join(package_dir, 'dist', 'index.js')
		const cli_entrypoint_path = path.join(package_dir, 'dist', 'cli.js')

		if (!(await fs.pathExists(entrypoint_path))) {
			throw new Error(`Packaged Polywise entrypoint not found: ${entrypoint_path}`)
		}

		if (!(await fs.pathExists(cli_entrypoint_path))) {
			throw new Error(`Packaged Polywise CLI entrypoint not found: ${cli_entrypoint_path}`)
		}

		return {
			package_dir,
			entrypoint_path,
			cli_entrypoint_path,
			spawn_cwd: package_dir
		}
	}

	const entrypoint_path = require.resolve('polywise')
	const package_dir = path.dirname(path.dirname(entrypoint_path))
	const cli_entrypoint_path = path.join(package_dir, 'dist', 'cli.js')

	if (!(await fs.pathExists(entrypoint_path))) {
		throw new Error(`Polywise entrypoint not found: ${entrypoint_path}`)
	}

	if (!(await fs.pathExists(cli_entrypoint_path))) {
		throw new Error(`Polywise CLI entrypoint not found: ${cli_entrypoint_path}`)
	}

	return {
		package_dir,
		entrypoint_path,
		cli_entrypoint_path,
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

	private async registerCliCommand() {
		if (!app.isPackaged) {
			return
		}

		const global_bin_dir = getGlobalBinDir()

		if (!global_bin_dir) {
			console.warn('[polywise] skipped CLI registration because npm global bin could not be resolved')
			return
		}

		await fs.ensureDir(global_bin_dir)

		const target_path = path.join(global_bin_dir, cli_command_name)
		const existing_target_content = await fs.readFile(target_path, 'utf8').catch(() => null)

		if (existing_target_content && !isManagedCliWrapper(existing_target_content)) {
			console.log(`[polywise] skipped CLI registration because ${target_path} already exists`)
			return
		}

		const existing_command_path = resolveExistingPolywiseCommandPath()

		if (
			existing_command_path &&
			normalizePathForCompare(existing_command_path) !== normalizePathForCompare(target_path)
		) {
			console.log(
				`[polywise] skipped CLI registration because another polywise command already exists at ${existing_command_path}`
			)
			return
		}

		const { cli_entrypoint_path } = await resolvePolywisePaths()
		const next_content = renderCliWrapperContent(process.execPath, cli_entrypoint_path)

		if (existing_target_content === next_content) {
			return
		}

		await fs.writeFile(target_path, next_content, 'utf8')

		if (process.platform !== 'win32') {
			await fs.chmod(target_path, 0o755)
		}

		console.log(`[polywise] registered CLI command at ${target_path}`)
	}

	async ensureStarted() {
		if (await isServerReady()) {
			this.started_by_desktop = false
			await this.registerCliCommand().catch(error => {
				console.warn('[polywise] failed to register CLI command', error)
			})
			return
		}

		if (!this.child) {
			const { entrypoint_path, spawn_cwd } = await resolvePolywisePaths()

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
				await this.registerCliCommand().catch(error => {
					console.warn('[polywise] failed to register CLI command', error)
				})
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
