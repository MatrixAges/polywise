import os from 'os'

import getCommandRules from './getCommandRules'
import getGlobalRules from './getGlobalRules'
import getPlatformName from './getPlatformName'
import getPresetCommands from './getPresetCommands'
import hasTool from './hasTool'

export default () => {
	const commands = getPresetCommands()
		.filter(item => hasTool(item.name))
		.map(item => ({
			name: item.name,
			desc: item.desc,
			rules: getCommandRules(item.name)
		}))

	return {
		platform: getPlatformName(),
		arch: os.arch(),
		commands,
		global_rules: getGlobalRules(),
		updated_at: new Date().toISOString()
	}
}
