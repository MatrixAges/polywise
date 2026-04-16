import type { SystemCommandSpec } from '@core/fst/utils/system/types'

interface Args {
	command: string
	command_name: string
	command_spec: SystemCommandSpec | null
	matched_rules: Array<string>
	working_directory: string
}

export default (args: Args) => {
	const command_rules = args.command_spec?.rules.join('\n') || 'none'
	const matched_rules = args.matched_rules.join('\n') || 'none'
	const command_desc = args.command_spec?.desc ?? 'Unknown command'

	return [
		'Command execution requires security review.',
		'',
		`Working directory: ${args.working_directory}`,
		`Command name: ${args.command_name || 'unknown'}`,
		`Command description: ${command_desc}`,
		`Command string: ${args.command}`,
		'',
		'Configured risk rules:',
		command_rules,
		'',
		'Matched risk rules:',
		matched_rules
	].join('\n')
}
