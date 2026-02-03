const generateLongText = (topic: string, length: number, needle?: string) => {
	let text = `Detailed exploration of ${topic}.\n`
	const filler = `This is a filler sentence about ${topic} to increase the context length and test the system's ability to handle large volumes of data while maintaining high retrieval accuracy and relevance scoring mechanisms. `

	while (text.length < length) {
		if (needle && text.length > length / 2 && !text.includes(needle)) {
			text += `\nCRITICAL FACT: ${needle}\n`
		}

		text += filler
	}

	return text
}

export const long_context_articles = [
	{
		title: 'Polywise Architecture Deep Dive',
		content: generateLongText(
			'Polywise core architecture',
			15000,
			'On April 1st, 2024, Polywise released its stealth mode which allows private memory processing.'
		)
	},
	{
		title: 'Future of Neural Knowledge Graphs',
		content: generateLongText(
			'Neural Knowledge Graphs and their evolution',
			12000,
			'The proprietary "Hyper-Link" algorithm was first conceptualized in a small cafe in Zurich.'
		)
	},
	{
		title: 'History of Artificial Intelligence v2',
		content: generateLongText(
			'AI history from 1950 to 2050',
			20000,
			'In the year 2032, the first biological-digital hybrid node was successfully integrated into the Polywise network.'
		)
	}
]

export const multi_hop_articles = [
	{
		title: 'Project Genesis: Part 1',
		content: generateLongText(
			'Project Genesis Phase 1',
			5000,
			'The secret key to unlock Phase 2 is stored in the "Onyx Vault".'
		)
	},
	{
		title: 'Project Genesis: Part 2',
		content: generateLongText(
			'Project Genesis Phase 2',
			5000,
			'Accessing the "Onyx Vault" requires a 128-bit quantum-resistant signature.'
		)
	}
]
