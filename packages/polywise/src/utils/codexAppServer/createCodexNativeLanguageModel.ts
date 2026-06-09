import { createCodexAppServer } from 'ai-sdk-provider-codex-app-server'

import type { LanguageModel } from 'ai'

export default (args: { model: string }) => {
	const { model } = args
	const provider = createCodexAppServer({
		defaultSettings: {
			cwd: process.cwd(),
			approvalMode: 'on-request',
			sandboxMode: 'read-only',
			threadMode: 'stateless',
			logger: false
		}
	})

	return provider(model) as LanguageModel
}
