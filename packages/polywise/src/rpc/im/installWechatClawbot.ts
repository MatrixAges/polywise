import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'
import { isToolInstalled, runShellCommand } from '../linkcase/runtime'

const output_type = object({
	ok: boolean(),
	status: zod_enum(['missing', 'installed', 'ready', 'warning']),
	openclaw_installed: boolean(),
	plugin_installed: boolean(),
	ready: boolean(),
	detail: string(),
	stdout: string(),
	stderr: string()
})

const install_command = 'npx -y @tencent-weixin/openclaw-weixin-cli@latest install'

const getRelevantStatusLine = (output: string) => {
	return output
		.split('\n')
		.map(line => line.trim())
		.find(line => /openclaw-weixin|wechat/i.test(line))
}

const getReadyFromStatusLine = (line: string | undefined) => {
	if (!line) return false
	if (/(missing|disabled|offline|error|unauth|unauthorized|login required|not logged)/i.test(line)) {
		return false
	}

	return /(connected|online|ready|ok|active|running|authorized|logged in)/i.test(line)
}

export default p.output(output_type).mutation(async () => {
	const openclaw_installed = await isToolInstalled('openclaw')

	if (!openclaw_installed) {
		throw new Error(
			'OpenClaw CLI was not found on this machine. Install OpenClaw before installing the WeChat plugin.'
		)
	}

	const result = await runShellCommand(install_command, 20 * 60 * 1000)
	const [plugins_result, channels_result] = await Promise.all([
		runShellCommand('openclaw plugins list', 15000),
		runShellCommand('openclaw channels status --probe', 15000)
	])
	const plugins_output = `${plugins_result.stdout}\n${plugins_result.stderr}`.trim()
	const channels_output = `${channels_result.stdout}\n${channels_result.stderr}`.trim()
	const plugin_installed = /\bopenclaw-weixin\b/i.test(plugins_output)
	const status_line = getRelevantStatusLine(channels_output)
	const ready = getReadyFromStatusLine(status_line)

	return {
		ok: result.exitCode === 0,
		status: ready ? ('ready' as const) : result.exitCode === 0 ? ('installed' as const) : ('warning' as const),
		openclaw_installed,
		plugin_installed,
		ready,
		detail:
			status_line ||
			result.stderr.trim() ||
			result.stdout.trim() ||
			'WeChat plugin install command finished.',
		stdout: result.stdout,
		stderr: result.stderr
	}
})
