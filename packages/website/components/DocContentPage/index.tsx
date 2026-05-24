'use client'

import { useEffect, useState } from 'react'
import MDXContent from '@website/components/MDXContent'
import Toc from '@website/components/Toc'
import Sheet from '@website/components/ui/Sheet'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { $ } from '@website/utils'

import styles from './index.module.css'
import md_styles from '@website/styles/markdown.module.css'

import type { TocItem } from '@website/types'

interface IProps {
	md: string
	toc: TocItem[]
}

export const toc_emitter = new EventTarget()

const Index = (props: IProps) => {
	const { md, toc } = props
	const [open_toc, setOpenToc] = useState(false)

	const openToc = useMemoizedFn(() => setOpenToc(true))
	const closeToc = useMemoizedFn(() => setOpenToc(false))

	useEffect(() => {
		toc_emitter.addEventListener('show_toc', openToc)

		return () => toc_emitter.removeEventListener('show_toc', openToc)
	}, [])

	const TocContent = (
		<div
			className={$.cx(
				`
				fixed
				top-0 right-0
				box-border
				h-screen
				doc_toc
			`,
				styles.toc
			)}
		>
			<Toc list={toc}></Toc>
		</div>
	)

	return (
		<div className='w-full'>
			<div className={$.cx('box-border', styles.content_wrap)}>
				<div className={$.cx('box-border', styles.content, md_styles.md)}>
					<MDXContent md={md}></MDXContent>
				</div>
			</div>
			<Sheet
				rootClassName={styles.drawer}
				open={open_toc}
				placement='right'
				maskClosable
				width={300}
				onClose={closeToc}
			>
				<div
					className='
						flex
						w-full
						pt-6
						pl-6 pr-0
						doc_toc
					'
				>
					<Toc list={toc}></Toc>
				</div>
			</Sheet>
			{TocContent}
		</div>
	)
}

export default $.memo(Index)
