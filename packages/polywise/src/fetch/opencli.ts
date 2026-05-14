import { randomUUID } from 'crypto'

import { runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

type OpencliExtractEnvelope = {
	content?: string
	next_start_char?: number | null
	error?: {
		code?: string
		message?: string
	}
}

const getOpencliBaseArgs = () => {
	const profile = process.env.OPENCLI_PROFILE?.trim()
	const args = ['--window', 'background']

	return profile ? ['--profile', profile, ...args] : args
}

const parseJsonOutput = <T>(stdout: string, fallback_message: string): T => {
	try {
		return JSON.parse(stdout) as T
	} catch {
		throw new Error(fallback_message)
	}
}

const runOpencliBrowserCommand = async (args: Array<string>, timeout: number) => {
	const result = await runCommand('opencli', [...getOpencliBaseArgs(), ...args], timeout)

	if (result.exitCode !== 0) {
		throw new Error(result.stderr || result.stdout || 'opencli failed')
	}

	return result.stdout
}

const fetchWithOpencli: FetchProviderHandler = async ({ url, max_chars }) => {
	const session = `polywise-${randomUUID()}`
	const chunk_size = String(Math.max(100, max_chars))

	try {
		await runOpencliBrowserCommand(['browser', session, 'open', url], 30000)
		await runOpencliBrowserCommand(['browser', session, 'wait', 'time', '3', '--timeout', '45000'], 45000)

		const extract_stdout = await runOpencliBrowserCommand(
			['browser', session, 'extract', '--chunk-size', chunk_size],
			30000
		)
		const envelope = parseJsonOutput<OpencliExtractEnvelope>(
			extract_stdout,
			'opencli extract returned invalid JSON'
		)

		if (envelope.error?.message) {
			throw new Error(envelope.error.message)
		}

		if (!envelope.content?.trim()) {
			throw new Error('opencli returned empty content')
		}

		const trimmed = trimContent(envelope.content, max_chars)

		return {
			ok: true,
			source: 'opencli',
			content: trimmed.content,
			truncated: trimmed.truncated || envelope.next_start_char != null
		}
	} finally {
		await runCommand('opencli', [...getOpencliBaseArgs(), 'browser', session, 'close'], 10000).catch(() => null)
	}
}

export default fetchWithOpencli
