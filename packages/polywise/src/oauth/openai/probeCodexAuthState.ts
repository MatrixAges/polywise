import buildCodexHeaders from './buildCodexHeaders'
import { codex_base_url } from './constants'
import getValidCodexAuthState from './getValidCodexAuthState'
import refreshCodexAuthState from './refreshCodexAuthState'
import transformCodexRequest from './transformCodexRequest'

import type { CodexAuthState } from './types'

const buildProbeBody = () => {
	return transformCodexRequest({
		model: 'gpt-5.1',
		input: [
			{
				type: 'message',
				role: 'user',
				content: [
					{
						type: 'input_text',
						text: 'ping'
					}
				]
			}
		],
		max_output_tokens: 1
	})
}

const requestProbe = async (auth_state: CodexAuthState) => {
	return fetch(`${codex_base_url}/codex/responses`, {
		method: 'POST',
		headers: buildCodexHeaders({
			access_token: auth_state.access_token,
			account_id: auth_state.account_id
		}),
		body: JSON.stringify(buildProbeBody()),
		signal: AbortSignal.timeout(10_000)
	})
}

const isAuthorizedResponse = (response: Response) => response.status !== 401 && response.status !== 403

export default async () => {
	let auth_state = await getValidCodexAuthState()

	if (!auth_state) {
		return {
			auth_state: null as CodexAuthState | null,
			connected: false
		}
	}

	let response = await requestProbe(auth_state)

	if (!isAuthorizedResponse(response)) {
		const refreshed_state = await refreshCodexAuthState()

		if (!refreshed_state) {
			return {
				auth_state,
				connected: false
			}
		}

		auth_state = refreshed_state
		response = await requestProbe(auth_state)
	}

	return {
		auth_state,
		connected: isAuthorizedResponse(response)
	}
}
