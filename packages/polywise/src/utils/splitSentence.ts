import { split } from 'sentence-splitter'

export default async (text_array: Array<string>) => {
	const targets = [] as Array<string>

	text_array.forEach(item => {
		const segments = split(item)

		targets.push(
			...segments
				.filter(node => node.type === 'Sentence')
				.map(node => node.raw.trim())
				.filter(s => s.length > 0)
		)
	})

	return targets
}
