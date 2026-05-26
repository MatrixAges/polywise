import { getUserLocale } from '@website/services'
import { getHeadings, getToc } from '@website/utils'
import { getContent } from '@website/utils/content'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toc as genToc } from 'mdast-util-toc'

export default async (path: string) => {
	const { locale } = await getUserLocale()
	const md = await getContent('docs', path, locale)

	if (!md) return { err: new Error(`Missing doc: ${path}`) }

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
