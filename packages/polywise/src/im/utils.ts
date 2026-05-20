export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const safeJsonParse = <T>(value: string | null | undefined, fallback: T): T => {
	if (!value) return fallback

	try {
		return JSON.parse(value) as T
	} catch {
		return fallback
	}
}

export const chunkText = (text: string, max_length: number) => {
	if (text.length <= max_length) return [text]

	const lines = text.split('\n')
	const chunks = [] as Array<string>
	let current = ''

	for (const line of lines) {
		const next = current ? `${current}\n${line}` : line

		if (next.length <= max_length) {
			current = next
			continue
		}

		if (current) {
			chunks.push(current)
			current = ''
		}

		if (line.length <= max_length) {
			current = line
			continue
		}

		let offset = 0
		while (offset < line.length) {
			chunks.push(line.slice(offset, offset + max_length))
			offset += max_length
		}
	}

	if (current) chunks.push(current)

	return chunks.filter(Boolean)
}
