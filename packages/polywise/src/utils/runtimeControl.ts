import { spawn } from 'child_process'
import { app } from '@core/consts'
import { runtime_pid_path } from '@core/consts/app'
import fs from 'fs-extra'

import { getRuntimeCommandEnv, resolveCommand } from './resolveCommand'

const shutdown_delay_ms = 150
const restart_poll_interval_ms = 150
const upgrade_timeout_ms = 10 * 60 * 1000
const upgrade_package_spec = 'polywise@latest'

const scheduleSelfSignal = (signal: NodeJS.Signals, delay_ms = shutdown_delay_ms) => {
	const timer = setTimeout(() => {
		try {
			process.kill(process.pid, signal)
		} catch {}
	}, delay_ms)

	timer.unref?.()
}

const getCurrentRuntimeArgs = () => {
	const args = process.argv.slice(1)

	if (!args.length) {
		throw new Error('Unable to resolve current runtime entrypoint')
	}

	return args
}

const spawnRestartLauncher = () => {
	const exec_path = process.execPath
	const args = getCurrentRuntimeArgs()
	const launcher_script = `
const { spawn } = require('child_process');
const oldPid = Number(process.argv[1]);
const execPath = process.argv[2];
const args = JSON.parse(process.argv[3]);
const waitForExit = () => {
	let alive = true;
	try {
		process.kill(oldPid, 0);
	} catch {
		alive = false;
	}
	if (alive) {
		setTimeout(waitForExit, ${restart_poll_interval_ms});
		return;
	}
	const child = spawn(execPath, args, {
		detached: true,
		stdio: 'ignore',
		env: process.env
	});
	child.unref();
};
waitForExit();
`

	const launcher = spawn(exec_path, ['-e', launcher_script, String(process.pid), exec_path, JSON.stringify(args)], {
		detached: true,
		stdio: 'ignore',
		env: getRuntimeCommandEnv()
	})

	launcher.unref()

	return {
		launcher_pid: launcher.pid ?? null,
		exec_path,
		args
	}
}

const runCommand = async (command: string, args: Array<string>, timeout_ms = upgrade_timeout_ms) => {
	const resolved_command = await resolveCommand(command)

	if (!resolved_command) {
		throw new Error(`Command not found: ${command}`)
	}

	return await new Promise<{ stdout: string; stderr: string; exit_code: number }>(resolve => {
		const stdout_chunks: Array<string> = []
		const stderr_chunks: Array<string> = []
		let settled = false
		const child = spawn(resolved_command, args, {
			shell: false,
			env: getRuntimeCommandEnv()
		})

		const timer = setTimeout(() => {
			if (settled) return

			settled = true
			child.kill('SIGKILL')

			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join('') || `Command timed out after ${timeout_ms}ms`,
				exit_code: 124
			})
		}, timeout_ms)

		child.stdout.on('data', chunk => {
			stdout_chunks.push(String(chunk))
		})

		child.stderr.on('data', chunk => {
			stderr_chunks.push(String(chunk))
		})

		child.on('error', error => {
			if (settled) return

			settled = true
			clearTimeout(timer)

			resolve({
				stdout: stdout_chunks.join(''),
				stderr: error.message || stderr_chunks.join(''),
				exit_code: 1
			})
		})

		child.on('close', code => {
			if (settled) return

			settled = true
			clearTimeout(timer)

			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join(''),
				exit_code: code ?? 1
			})
		})
	})
}

const getUpgradePlan = async () => {
	if (await resolveCommand('pnpm')) {
		return {
			package_manager: 'pnpm' as const,
			command: 'pnpm',
			args: ['i', '-g', upgrade_package_spec]
		}
	}

	if (await resolveCommand('npm')) {
		return {
			package_manager: 'npm' as const,
			command: 'npm',
			args: ['i', '-g', upgrade_package_spec]
		}
	}

	throw new Error('Neither pnpm nor npm is available')
}

export const writeRuntimePidFile = async () => {
	await fs.ensureDir(app.app_path)
	await fs.writeFile(runtime_pid_path, `${process.pid}\n`, 'utf8')
}

export const clearRuntimePidFile = async () => {
	await fs.remove(runtime_pid_path).catch(() => null)
}

export const scheduleRuntimeStop = () => {
	scheduleSelfSignal('SIGTERM')

	return {
		pid: process.pid,
		scheduled: true
	}
}

export const scheduleRuntimeRestart = () => {
	const restart = spawnRestartLauncher()

	scheduleSelfSignal('SIGTERM')

	return {
		pid: process.pid,
		scheduled: true,
		...restart
	}
}

export const upgradeRuntime = async () => {
	const plan = await getUpgradePlan()
	const result = await runCommand(plan.command, plan.args)

	if (result.exit_code !== 0) {
		const error_output = result.stderr.trim() || result.stdout.trim() || 'Unknown upgrade error'

		throw new Error(`Failed to upgrade polywise: ${error_output}`)
	}

	const restart = spawnRestartLauncher()

	scheduleSelfSignal('SIGTERM')

	return {
		package_manager: plan.package_manager,
		command: [plan.command, ...plan.args].join(' '),
		...result,
		restart_scheduled: true,
		...restart
	}
}
