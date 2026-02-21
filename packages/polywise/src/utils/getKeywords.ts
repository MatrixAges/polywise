export default (output_str: string): string[] => {
	let cleaned_output = output_str

	try {
		// Attempt to parse the valid JSON array string directly since the prompt implies the output should start with '['.
		// However, it's safer to extract everything between '[' and ']' just in case.
		const match = cleaned_output.match(/\[(.*?)\]/s)
		if (match) {
			const arr = JSON.parse(`[${match[1]}]`)
			if (Array.isArray(arr)) {
				return arr
					.map(k =>
						String(k)
							.replace(/^\[|\]$/g, '')
							.trim()
					)
					.filter(k => k.length > 0)
			}
		}
	} catch (error) {
		// fallback naive parsing if JSON.parse fails
		const match = cleaned_output.match(/\[(.*?)\]/s)
		if (match) {
			return match[1]
				.split(',')
				.map(k =>
					k
						.replace(/"/g, '')
						.replace(/^\[|\]$/g, '')
						.trim()
				)
				.filter(k => k.length > 0)
		}
	}

	return []
}
