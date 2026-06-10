const decodeBase64Url = (value: string) => {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
	const padding = normalized.length % 4
	const padded = padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), '=')

	return Buffer.from(padded, 'base64').toString('utf8')
}

export default (access_token: string) => {
	try {
		const payload = access_token.split('.')[1]

		if (!payload) {
			return null as number | null
		}

		const parsed = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown }

		return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
	} catch {
		return null as number | null
	}
}
