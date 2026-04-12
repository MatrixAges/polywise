import getCommandName from './getCommandName'

import type { SystemSpec } from '@core/utils/system/types'

export default (command: string, system_spec: SystemSpec) => {
	const command_name = getCommandName(command)
	const command_spec = system_spec.commands.find(item => item.name === command_name) ?? null
	const rules = [...system_spec.global_rules, ...(command_spec?.rules ?? [])]
	const matched_rules = rules.filter(rule => new RegExp(rule, 'i').test(command))

	return {
		command_name,
		command_spec,
		matched_rules
	}
}
