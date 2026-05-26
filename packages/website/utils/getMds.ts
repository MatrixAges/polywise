import { getUserLocale } from '@website/services'
import { getContentList } from '@website/utils/content'

export default async (type: 'journal' | 'changelog' | 'blog', ids: Array<string>) => {
	const { locale } = await getUserLocale()

	return await getContentList(type, ids, locale)
}
