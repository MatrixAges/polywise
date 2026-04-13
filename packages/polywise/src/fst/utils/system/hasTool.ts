import { spawnSync } from 'child_process'

import getDetectCommand from './getDetectCommand'

export default (tool_name: string) => {
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
