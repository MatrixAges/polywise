import { runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const default_screens = Math.max(1, Number.parseInt(process.env.DOKOBOT_SCREENS || '5', 10) || 5)
const max_steps = Math.max(1, Number.parseInt(process.env.DOKOBOT_MAX_STEPS || '10', 10) || 10)
const session_id_pattern = /session(?:\s+id)?\s*:\s*([A-Za-z0-9._:-]+)/i

const getSessionId = (output: string) => {
	return output.match(session_id_pattern)?.[1] ?? null
}

const buildReadArgs = (url: string, session_id?: string | null) => {
	const args = ['read', url, '--local', '--screens', String(default_screens)]

	if (session_id) {
		args.push('--session-id', session_id)
	}

	return args
}

const closeDokobotSession = async (session_id: string) => {
	const commands = [
		['doko', 'close', session_id],
		['close', session_id]
	]

	for (const args of commands) {
		const result = await runCommand('dokobot', args, 10000)

		if (result.exitCode === 0) {
			return
		}
	}
}

const fetchWithDokobot: FetchProviderHandler = async ({ url, max_chars }) => {
	let session_id: string | null = null
	let content = ''

	try {
		for (let step = 0; step < max_steps && content.length < max_chars; step += 1) {
			const result = await runCommand('dokobot', buildReadArgs(url, session_id), 45000)

			if (result.exitCode !== 0) {
				throw new Error(result.stderr || result.stdout || 'dokobot failed')
			}

			const chunk = result.stdout.trim()

			if (!chunk) {
				break
			}

			content = content ? `${content}\n\n${chunk}` : chunk

			const next_session_id = getSessionId(`${result.stdout}\n${result.stderr}`)

			if (!next_session_id || next_session_id === session_id) {
				session_id = next_session_id
				break
			}

			session_id = next_session_id
		}

		if (!content.trim()) {
			throw new Error('dokobot returned empty content')
		}

		return {
			ok: true,
			source: 'dokobot',
			...trimContent(content, max_chars)
		}
	} finally {
		if (session_id) {
			await closeDokobotSession(session_id).catch(() => null)
		}
	}
}

export default fetchWithDokobot
