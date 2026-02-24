export default async (text_array: Array<string>) => {
	const targets = [] as Array<string>

	text_array.forEach(item => {
		const segmenter = new Intl.Segmenter(['zh', 'en'], { granularity: 'sentence' })
		const segments = segmenter.segment(item)

		targets.push(
			...Array.from(segments)
				.map(s => s.segment.trim())
				.filter(s => s.length > 0)
		)
	})

	return targets
}
