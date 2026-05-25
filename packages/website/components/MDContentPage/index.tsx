'use client'

import { useRef, useState } from 'react'
import { GpsFixIcon } from '@phosphor-icons/react'
import MDXContent from '@website/components/MDXContent'
import Modal from '@website/components/Modal'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { $ } from '@website/utils'
import { useInView } from 'framer-motion'
import { Fragment } from 'react/jsx-runtime'

import styles from './index.module.css'
import md_styles from '@website/styles/markdown.module.css'

import type { ReactNode } from 'react'

interface IProps {
	id?: string
	title?: string
	md: string
	id_prefix?: string
	hide_id?: boolean
	children?: ReactNode
	simple?: boolean
	with_bg?: boolean
}

const Index = (props: IProps) => {
	const { id, md, title, id_prefix, hide_id, children, simple, with_bg } = props
	const toc = useRef(null)
	const visible = useInView(toc)
	const [open, setOpen] = useState(false)

	const show = useMemoizedFn(() => setOpen(true))
	const close = useMemoizedFn(() => setOpen(false))

	return (
		<div
			className={$.cx(
				`
				relative
				flex
				items-center justify-center
				w-full
			`,
				styles._local,
				simple && styles.simple
			)}
		>
			<section className={$.cx('w-full', !simple && 'small_content_wrap section_wrap relative')}>
				{!simple && (
					<div className='header_wrap flex flex-col items-center'>
						{title ? (
							<Fragment>
								<h1 className='section_title pure'>{title}</h1>
								{!hide_id && (
									<span className='id'>
										{id_prefix}
										{id}
									</span>
								)}
							</Fragment>
						) : (
							<span className='section_title pure'>
								{id_prefix}
								{id}
							</span>
						)}
					</div>
				)}
				<div
					className={$.cx(
						'content_wrap box-border w-full',
						md_styles.md,
						with_bg && md_styles.with_bg
					)}
				>
					{children && (
						<Fragment>
							<div className='toc_wrap box-border w-full' ref={toc}>
								{children}
							</div>
							{!visible && (
								<Fragment>
									<button
										className='
											fixed
											flex
											items-center justify-center
											btn_open_toc clickable
										'
										onClick={show}
									>
										<GpsFixIcon></GpsFixIcon>
									</button>
									<Modal
										className={styles.toc_modal}
										width='480px'
										open={open}
										maskClosable
										onCancel={close}
									>
										<div className='toc_wrap w-full' ref={toc}>
											{children}
										</div>
									</Modal>
								</Fragment>
							)}
						</Fragment>
					)}
					<MDXContent md={md}></MDXContent>
				</div>
			</section>
		</div>
	)
}

export default $.memo(Index)
