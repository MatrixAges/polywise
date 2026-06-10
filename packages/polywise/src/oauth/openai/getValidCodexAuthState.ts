import getAccessTokenExpiry from './getAccessTokenExpiry'
import readCodexAuthState from './readCodexAuthState'
import refreshCodexAuthState from './refreshCodexAuthState'

export default async () => {
	const state = await readCodexAuthState()

	if (!state) {
		return null
	}

	const expires_at = getAccessTokenExpiry(state.access_token)

	if (expires_at !== null && expires_at - 60_000 <= Date.now()) {
		return (await refreshCodexAuthState()) ?? state
	}

	return state
}
