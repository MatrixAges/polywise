'use client'

import { ArrowCircleDownIcon, BookmarkIcon } from '@phosphor-icons/react'
import { $ } from '@website/utils'
import Link from 'next/link'

import styles from './index.module.css'

const Index = () => {
	return (
		<div className={$.cx('btn_group flex', styles._local)}>
			<Link
				className='
					flex
					items-center justify-center
					btn_app clickable
				'
				href='/docs/intro'
			>
				<BookmarkIcon className='logo_app_store' weight='fill' size={30}></BookmarkIcon>
				<div className='flex flex-col items-start'>
					<span className='line_1'>Read the docs</span>
					<span className='line_2'>Intro</span>
				</div>
			</Link>
			<Link
				className='
					flex
					items-center justify-center
					btn_app clickable
				'
				href='/download'
			>
				<ArrowCircleDownIcon className='logo_app_store' weight='fill' size={30}></ArrowCircleDownIcon>
				<div className='flex flex-col items-start'>
					<span className='line_1'>Download release</span>
					<span className='line_2'>Installs</span>
				</div>
			</Link>
		</div>
	)
}

export default $.memo(Index)
