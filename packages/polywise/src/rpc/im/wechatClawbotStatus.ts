import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'
import { isToolInstalled, runShellCommand } from '../linkcase/runtime'

const output_type = object({
	status: zod_enum(['missing', 'installed', 'ready', 'warning']),
	openclaw_installed: boolean(),
	plugin_installed: boolean(),
	ready: boolean(),
	detail: string(),
	install_command: string()
})

const plugin_id = 'openclaw-weixin'
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

export default p.output(output_type).query(async () => {
	const openclaw_installed = await isToolInstalled('openclaw')

	if (!openclaw_installed) {
		return {
			status: 'missing' as const,
			openclaw_installed,
			plugin_installed: false,
			ready: false,
			detail: 'OpenClaw CLI was not found on this machine. Install OpenClaw first, then install the WeChat plugin.',
			install_command
		}
	}

	const [plugins_result, channels_result] = await Promise.all([
		runShellCommand('openclaw plugins list', 15000),
		runShellCommand('openclaw channels status --probe', 15000)
	])

	const plugins_output = `${plugins_result.stdout}\n${plugins_result.stderr}`.trim()
	const channels_output = `${channels_result.stdout}\n${channels_result.stderr}`.trim()
	const plugin_installed = new RegExp(`\\b${plugin_id}\\b`, 'i').test(plugins_output)
	const status_line = getRelevantStatusLine(channels_output)
	const ready = plugin_installed && getReadyFromStatusLine(status_line)

	if (!plugin_installed) {
		return {
			status: 'missing' as const,
			openclaw_installed,
			plugin_installed,
			ready: false,
			detail: 'WeChat plugin is not installed for OpenClaw yet.',
			install_command
		}
	}

	if (ready) {
		return {
			status: 'ready' as const,
			openclaw_installed,
			plugin_installed,
			ready,
			detail: status_line || 'WeChat plugin is installed and the channel probe looks healthy.',
			install_command
		}
	}

	if (status_line) {
		return {
			status: 'installed' as const,
			openclaw_installed,
			plugin_installed,
			ready: false,
			detail: status_line,
			install_command
		}
	}

	return {
		status: 'warning' as const,
		openclaw_installed,
		plugin_installed,
		ready: false,
		detail:
			channels_output ||
			'WeChat plugin is installed, but channel status could not be confirmed. You may still need to login with `openclaw channels login --channel openclaw-weixin`.',
		install_command
	}
})
