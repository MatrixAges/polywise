import { getUserLocale } from '@website/services'
import { getHeadings, getToc } from '@website/utils'
import { getContent } from '@website/utils/content'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toc as genToc } from 'mdast-util-toc'

export default async (type: 'journal' | 'changelog' | 'blog', id: string, with_toc?: boolean) => {
	const { locale } = await getUserLocale()
	const md = getContent(type, id, locale)

	if (!md) {
		throw new Error(`Missing content: ${type}/${id}/${locale}`)
	}

	if (with_toc) {
		const ast = fromMarkdown(md)
		const map = getHeadings(ast)
		const toc_list = genToc(ast, { ordered: true })

		let toc = getToc(map, toc_list.map?.children!)

		if (toc?.length === 1) {
			const first = toc[0] as any

			if (first.level === 1 && first.children?.length) {
				toc = first.children
			}
		}

		return { md, toc }
	}

	return md
}
