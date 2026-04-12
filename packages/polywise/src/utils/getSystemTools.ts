import { createSystemSpec, getSystemToolsPrompt } from './system'

export default async () => {
	const system_spec = createSystemSpec()

	return getSystemToolsPrompt(system_spec)
}
