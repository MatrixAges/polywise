import { audit } from '../../agents'
import checkPermission from '../checkPermission'
import getBashResponse from '../getBashResponse'
import { createSystemSpec } from '../system'
import { detect_command } from './constants'
import executeRiskyCommand from './executeRiskyCommand'
import getCleanCommand from './getCleanCommand'
import getCommandAuditPrompt from './getCommandAuditPrompt'
import getMatchedRules from './getMatchedRules'

import type { Bash } from 'just-bash'
import type Index from '../../session'

interface Args {
	s: Index
	bash: Bash
	command: string
	system?: boolean
}

export default async (args: Args) => {
	const { s, bash, command, system } = args

	if (command === detect_command) {
		const res = await bash.exec(command, { cwd: '/' })

		return getBashResponse(res)
	}

	const clean_command = getCleanCommand(command)
	const perm_error = await checkPermission(s, 'bash', 'execute', clean_command, clean_command, system)

	if (perm_error) {
		return { stdout: '', stderr: perm_error, exitCode: 1 }
	}

	const system_spec = createSystemSpec()
	const { command_name, command_spec, matched_rules } = getMatchedRules(clean_command, system_spec)

	if (!matched_rules.length) {
		const res = await bash.exec(command, { cwd: '/' })

		return getBashResponse(res)
	}

	const audit_prompt = getCommandAuditPrompt({
		command: clean_command,
		command_name,
		command_spec,
		matched_rules,
		working_directory: s.cwd
	})
	const approved = await audit(s, audit_prompt)

	if (!approved) {
		return {
			stdout: '',
			stderr: `Command blocked by audit: ${clean_command}`,
			exitCode: 1
		}
	}

	return executeRiskyCommand(clean_command, s.cwd)
}
