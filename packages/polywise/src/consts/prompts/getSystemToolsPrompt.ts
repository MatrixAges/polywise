import type { SystemSpec } from '@core/fst/utils/system/types'

export default (system_spec: SystemSpec) => {
	const command_lines = system_spec.commands.length
		? system_spec.commands.map(item => `- ${item.name}: ${item.desc}`).join('\n')
		: 'none'

	return `Current system: ${system_spec.platform} (${system_spec.arch})\nSupported commands:\n${command_lines}`
}
