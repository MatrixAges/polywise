import type { OpenCodeCredential } from './types'

const stripAnsi = (value: string) => value.replace(/\u001B\[[0-9;]*m/g, '')

export default (output: string) => {
	const lines = stripAnsi(output)
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
	const credentials = [] as Array<OpenCodeCredential>
	let in_credentials = false

	for (const line of lines) {
		const normalized_line = line.replace(/^[┌└│\s]+/u, '').trim()

		if (normalized_line.startsWith('Credentials')) {
			in_credentials = true
			continue
		}

		if (!in_credentials) {
			continue
		}

		if (normalized_line.startsWith('Environment')) {
			break
		}

		const matched_credential = /^●\s+(.+?)\s+(api|oauth)\s*$/i.exec(normalized_line)

		if (matched_credential) {
			credentials.push({
				name: matched_credential[1] || '',
				method: (matched_credential[2] || '').toLowerCase()
			})
		}
	}

	return credentials
}
