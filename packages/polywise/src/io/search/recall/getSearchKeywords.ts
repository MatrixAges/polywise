import { getKeywords } from '@core/pipeline'

export default async (text: string) => {
	const keywords = await getKeywords(text)
	return keywords.join(', ')
}
