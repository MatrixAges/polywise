'use client'

import tocIcon from '@website/svgs/toc.inline.svg'
import { $ } from '@website/utils'
import { Anchor } from 'antd'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

import type { AnchorProps } from 'antd'

interface IProps {
	list: AnchorProps['items']
	className?: string
	as_content?: boolean
}

const Index = (props: IProps) => {
	const { list, className, as_content } = props
	const t = useTranslations('doc')

	return (
		<div className={$.cx('box-border h-full', styles._local, as_content && styles.as_content, className)}>
			<div className='flex flex-col'>
				{!as_content && (
					<div className='header_wrap sticky flex items-center'>
						<img src={tocIcon} alt='' aria-hidden />
						<span className='title'>{t('toc.title')}</span>
					</div>
				)}
				<Anchor items={list} affix={false} offsetTop={600}></Anchor>
			</div>
		</div>
	)
}

export default $.memo(Index)
