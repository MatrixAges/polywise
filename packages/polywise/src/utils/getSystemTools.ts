import { spawnSync } from 'child_process'
import os from 'os'

const preset_tools = [
	'grep',
	'tree',
	'rg',
	'fd',
	'cat',
	'head',
	'tail',
	'lsof',
	'patch',
	'diff',
	'sed',
	'awk',
	'sg',
	'jq',
	'git'
] as const

const getPlatformName = () => {
	switch (process.platform) {
		case 'darwin':
			return 'macOS'
		case 'win32':
			return 'Windows'
		case 'linux':
			return 'Linux'
		default:
			return process.platform
	}
}

const getDetectCommand = (tool_name: string) => {
	if (process.platform === 'win32') {
		return {
			command: 'where',
			args: [tool_name]
		}
	}

	return {
		command: 'command',
		args: ['-v', tool_name]
	}
}

const hasTool = (tool_name: string) => {
	const detect_command = getDetectCommand(tool_name)
	const shell = process.env.SHELL ?? '/bin/sh'

	if (process.platform === 'win32') {
		const result = spawnSync(detect_command.command, detect_command.args, { encoding: 'utf8' })

		return result.status === 0
	}

	const result = spawnSync(shell, ['-lc', `${detect_command.command} ${detect_command.args.join(' ')}`], {
		encoding: 'utf8'
	})

	return result.status === 0
}

const getSupportedTools = () => {
	return preset_tools.filter(hasTool)
}

export default () => {
	const platform_name = getPlatformName()
	const arch_name = os.arch()
	const supported_tools = getSupportedTools()

	return `Current system: ${platform_name} (${arch_name})\nSupported commands: ${supported_tools.join(', ') || 'none'}`
}
