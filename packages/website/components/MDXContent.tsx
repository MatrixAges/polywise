'use client'

import { useMemo } from 'react'
import { $ } from '@website/utils'
import { SafeMdxRenderer } from 'safe-mdx'
import { mdxParse } from 'safe-mdx/parse'

import { components } from './Mdx'

interface IProps {
	md: string
}

const Index = (props: IProps) => {
	const { md } = props
	const mdast = useMemo(() => mdxParse(md), [md])

	return <SafeMdxRenderer markdown={md} mdast={mdast} components={components as any}></SafeMdxRenderer>
}

export default $.memo(Index)
