import { getUserLocale } from '@website/services'
import { getContentList } from '@website/utils/content'

export default async (type: 'journal' | 'changelog' | 'blog', ids: Array<string>) => {
	const { locale } = await getUserLocale()

	return getContentList(type, ids, locale)
}
