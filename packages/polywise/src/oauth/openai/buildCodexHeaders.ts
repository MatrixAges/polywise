export default (args: { init?: RequestInit; access_token: string; account_id: string }) => {
	const { init, access_token, account_id } = args
	const headers = new Headers(init?.headers ?? {})

	headers.delete('authorization')
	headers.delete('x-api-key')
	headers.set('Authorization', `Bearer ${access_token}`)
	headers.set('OpenAI-Beta', 'responses=experimental')
	headers.set('chatgpt-account-id', account_id)
	headers.set('originator', 'codex_cli_rs')
	headers.set('accept', 'text/event-stream')

	return headers
}
