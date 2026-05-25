'use client'

import { ArrowCircleDownIcon, ChatTeardropTextIcon } from '@phosphor-icons/react'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'

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
				href='/docs/getting_started/start_guide'
			>
				<ChatTeardropTextIcon className='logo_app_store' weight='fill' size={30}></ChatTeardropTextIcon>
				<div className='flex flex-col items-start'>
					<span className='line_1'>Getting started</span>
					<span className='line_2'>Document</span>
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
