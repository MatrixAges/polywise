import { spawn } from 'child_process'
import { readdir } from 'fs/promises'
import os from 'os'
import path from 'path'

import { resolveCommand } from '../../utils/resolveCommand'

import type { LinkcaseProviderCheck, LinkcaseProviderCheckStatus } from './providers'

export const isToolInstalled = async (tool_name: string) => {
	return Boolean(await resolveCommand(tool_name))
}

export const runShellCommand = async (command: string) => {
	const shell = process.env.SHELL ?? '/bin/sh'

	return await new Promise<{ stdout: string; stderr: string; exitCode: number }>(resolve => {
		const stdout_chunks: Array<string> = []
		const stderr_chunks: Array<string> = []
		const use_windows_shell = process.platform === 'win32'

		const child = use_windows_shell
			? spawn('cmd', ['/d', '/s', '/c', command], {
					shell: false,
					env: process.env
				})
			: spawn(shell, ['-lc', command], {
					shell: false,
					env: process.env
				})

		child.stdout?.on('data', chunk => {
			stdout_chunks.push(String(chunk))
		})

		child.stderr?.on('data', chunk => {
			stderr_chunks.push(String(chunk))
		})

		child.on('error', error => {
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: error.message || stderr_chunks.join(''),
				exitCode: 1
			})
		})

		child.on('close', code => {
			resolve({
				stdout: stdout_chunks.join(''),
				stderr: stderr_chunks.join(''),
				exitCode: code ?? 1
			})
		})
	})
}

const opencli_browser_bridge_install_url = 'https://github.com/jackwener/opencli/releases'
const crawl4ai_identity_docs_url = 'https://docs.crawl4ai.com/advanced/identity-based-crawling/'
const dokobot_agent_features_url = 'https://dokobot.ai/zh-CN/help/agent-features'

const getStatusFromDoctorOutput = (output: string): LinkcaseProviderCheckStatus => {
	if (/\[OK\]\s+Extension:/i.test(output) && /\[OK\]\s+Connectivity:/i.test(output)) return 'ok'
	if (/\[MISSING\]\s+Extension:/i.test(output)) return 'missing'
	if (/\[FAIL\]\s+Connectivity:/i.test(output)) return 'warning'
	return 'info'
}

export const getOpencliBrowserBridgeCheck = async (): Promise<LinkcaseProviderCheck> => {
	const result = await runShellCommand('opencli doctor')
	const output = `${result.stdout}\n${result.stderr}`.trim()

	if (!output) {
		return {
			id: 'browser-bridge',
			label: 'Browser Bridge',
			status: 'warning',
			detail: 'opencli doctor returned no output.'
		}
	}

	const status = getStatusFromDoctorOutput(output)

	if (status === 'ok') {
		return {
			id: 'browser-bridge',
			label: 'Browser Bridge',
			status,
			detail: 'Connected to the local Chrome/Chromium extension.'
		}
	}

	if (status === 'missing') {
		return {
			id: 'browser-bridge',
			label: 'Browser Bridge',
			status,
			detail: 'The Chrome extension is not connected.',
			action_label: 'Install bridge',
			action_url: opencli_browser_bridge_install_url
		}
	}

	return {
		id: 'browser-bridge',
		label: 'Browser Bridge',
		status,
		detail: output,
		action_label: 'Install bridge',
		action_url: opencli_browser_bridge_install_url
	}
}

export const getAgentBrowserChromeProfileCheck = async (): Promise<LinkcaseProviderCheck> => {
	const result = await runShellCommand('agent-browser profiles')
	const output = `${result.stdout}\n${result.stderr}`.trim()

	if (result.exitCode !== 0) {
		return {
			id: 'chrome-session',
			label: 'Chrome session reuse',
			status: 'warning',
			detail: 'Unable to inspect local Chrome profiles, but agent-browser can still attach via CDP.'
		}
	}

	const profile_lines = output
		.split('\n')
		.map(line => line.trim())
		.filter(line => Boolean(line) && !line.toLowerCase().startsWith('chrome profiles'))
	const profile_count = profile_lines.length

	return {
		id: 'chrome-session',
		label: 'Chrome session reuse',
		status: 'info',
		detail:
			profile_count > 0
				? `CDP attach is available; detected ${profile_count} local Chrome profile${profile_count === 1 ? '' : 's'}.`
				: 'CDP attach is available; no local Chrome profiles were listed.'
	}
}

export const getCrawl4aiProfileCheck = async (): Promise<LinkcaseProviderCheck> => {
	const profiles_dir = path.join(os.homedir(), '.crawl4ai', 'profiles')

	try {
		const entries = await readdir(profiles_dir, { withFileTypes: true })
		const profile_count = entries.filter(entry => entry.isDirectory()).length

		return {
			id: 'managed-profiles',
			label: 'Managed profiles',
			status: 'info',
			detail:
				profile_count > 0
					? `Detected ${profile_count} Crawl4AI managed profile${profile_count === 1 ? '' : 's'} for logged-in browsing sessions.`
					: 'No Crawl4AI managed profiles detected yet. Create one with `crwl profiles` if you want logged-in session reuse.',
			action_label: 'Session docs',
			action_url: crawl4ai_identity_docs_url
		}
	} catch {
		return {
			id: 'managed-profiles',
			label: 'Managed profiles',
			status: 'info',
			detail: 'No Crawl4AI managed profiles detected yet. Create one with `crwl profiles` if you want logged-in session reuse.',
			action_label: 'Session docs',
			action_url: crawl4ai_identity_docs_url
		}
	}
}

export const getDokobotBridgeCheck = async (): Promise<LinkcaseProviderCheck> => {
	const result = await runShellCommand('dokobot doko list')
	const output = `${result.stdout}\n${result.stderr}`.trim()

	if (result.exitCode !== 0) {
		return {
			id: 'browser-bridge',
			label: 'Browser bridge',
			status: 'warning',
			detail:
				output ||
				'Dokobot CLI is installed, but the local browser bridge is not ready. Install the extension, enable Remote Control, and run `dokobot install-bridge`.',
			action_label: 'Setup guide',
			action_url: dokobot_agent_features_url
		}
	}

	if (!output || /no\s+(registered\s+)?(devices|device|bridges?)/i.test(output)) {
		return {
			id: 'browser-bridge',
			label: 'Browser bridge',
			status: 'missing',
			detail: 'No Dokobot local bridge/device was detected. Install the extension, enable Remote Control, and run `dokobot install-bridge`.',
			action_label: 'Setup guide',
			action_url: dokobot_agent_features_url
		}
	}

	const device_lines = output
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)

	return {
		id: 'browser-bridge',
		label: 'Browser bridge',
		status: 'ok',
		detail:
			device_lines.length > 0
				? `Dokobot bridge/device list returned ${device_lines.length} line${device_lines.length === 1 ? '' : 's'}.`
				: 'Dokobot local bridge is responding.',
		action_label: 'Setup guide',
		action_url: dokobot_agent_features_url
	}
}
