import getSystemToolsPrompt from '@core/consts/prompts/getSystemToolsPrompt'

import { createSystemSpec } from '../fst/utils/system'

export default async () => {
	const system_spec = createSystemSpec()

	return getSystemToolsPrompt(system_spec)
}
