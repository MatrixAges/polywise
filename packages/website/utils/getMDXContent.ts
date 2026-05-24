import { components } from '@website/components/Mdx'
import { jsx } from 'react/jsx-runtime'
import { SafeMdxRenderer } from 'safe-mdx'
import { mdxParse } from 'safe-mdx/parse'

export default (md: string) => {
	const mdast = mdxParse(md)

	return () =>
		jsx(SafeMdxRenderer, {
			markdown: md,
			mdast,
			components: components as any
		})
}
