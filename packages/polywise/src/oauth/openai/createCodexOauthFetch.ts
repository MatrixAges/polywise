import buildCodexHeaders from './buildCodexHeaders'
import getValidCodexAuthState from './getValidCodexAuthState'
import refreshCodexAuthState from './refreshCodexAuthState'
import transformCodexRequest from './transformCodexRequest'

import type { FetchFunction } from '@ai-sdk/provider-utils'

const extractRequestUrl = (input: Request | string | URL) => {
	if (typeof input === 'string') {
		return input
	}

	if (input instanceof URL) {
		return input.toString()
	}

	return input.url
}

const rewriteCodexUrl = (value: string) => value.replace('/responses', '/codex/responses')

const parseRequestBody = (init?: RequestInit) => {
	if (typeof init?.body !== 'string') {
		return null as Record<string, unknown> | null
	}

	try {
		return JSON.parse(init.body) as Record<string, unknown>
	} catch {
		return null as Record<string, unknown> | null
	}
}

const isStreamingRequest = (body: Record<string, unknown> | null) => body?.stream === true

const parseSseResponse = (value: string) => {
	const lines = value.split('\n')

	for (const line of lines) {
		if (!line.startsWith('data: ')) {
			continue
		}

		try {
			const data = JSON.parse(line.slice(6)) as {
				type?: string
				response?: unknown
			}

			if (data.type === 'response.completed' || data.type === 'response.done') {
				return data.response ?? null
			}
		} catch {
			continue
		}
	}

	return null
}

const convertSseToJson = async (response: Response) => {
	const content_type = response.headers.get('content-type') || ''

	if (content_type.includes('application/json')) {
		return response
	}

	const payload = await response.text()
	const parsed = parseSseResponse(payload)

	if (parsed === null) {
		return new Response(payload, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers
		})
	}

	const headers = new Headers(response.headers)

	headers.set('content-type', 'application/json; charset=utf-8')

	return new Response(JSON.stringify(parsed), {
		status: response.status,
		statusText: response.statusText,
		headers
	})
}

const performCodexRequest = async (args: {
	input: Request | string | URL
	init?: RequestInit
	access_token: string
	account_id: string
}) => {
	const { input, init, access_token, account_id } = args
	const original_body = parseRequestBody(init)
	const transformed_body = original_body ? transformCodexRequest(original_body) : null
	const response = await fetch(rewriteCodexUrl(extractRequestUrl(input)), {
		...init,
		headers: buildCodexHeaders({ init, access_token, account_id }),
		body: transformed_body ? JSON.stringify(transformed_body) : init?.body
	})

	return {
		response,
		is_streaming: isStreamingRequest(original_body)
	}
}

export default () => {
	const fetcher = Object.assign(async (...args: Parameters<FetchFunction>) => {
		const [input, init] = args
		const initial_auth = await getValidCodexAuthState()

		if (!initial_auth) {
			throw new Error('Codex ChatGPT login was not found. Run `codex login` first.')
		}

		let result = await performCodexRequest({
			input,
			init,
			access_token: initial_auth.access_token,
			account_id: initial_auth.account_id
		})

		if (result.response.status === 401) {
			const refreshed_auth = await refreshCodexAuthState()

			if (refreshed_auth) {
				result = await performCodexRequest({
					input,
					init,
					access_token: refreshed_auth.access_token,
					account_id: refreshed_auth.account_id
				})
			}
		}

		if (!result.response.ok || result.is_streaming) {
			return result.response
		}

		return await convertSseToJson(result.response)
	}, fetch) satisfies FetchFunction

	return fetcher
}
