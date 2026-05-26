import { getUserLocale } from '@website/services'
import { getContent } from '@website/utils/content'

export default async (name: string) => {
	const { locale } = await getUserLocale()

	return (await getContent('resources', name, locale))!
}
