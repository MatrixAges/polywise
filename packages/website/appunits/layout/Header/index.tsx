'use client'

import { Fragment } from 'react'
import { List } from '@phosphor-icons/react'
import LogoWithBg from '@website/components/LogoWithBg'
import { useToggle } from '@website/hooks/ahooks'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { Drawer } from 'antd'
import { useTranslations } from 'next-intl'

import Item from './Item'
import nav_items from './nav_items'

import styles from './index.module.css'

const Index = () => {
	const [open, { toggle }] = useToggle()
	const t = useTranslations('layout')

	const Content = (
		<Fragment>
			<div className={$.cx('fixed top-0 left-0 w-screen', styles.mask)}></div>
			<nav
				className={$.cx(
					`
					fixed
					top-0
					left-0
					box-border
					z-[1000]
					flex-col
					w-screen
				`,
					styles._local
				)}
			>
				<div
					className='
						box-border
						flex
						items-center justify-between
						header_content_wrap
					'
				>
					<Link
						className='
							flex
							items-center justify-center
							logo_wrap clickable
						'
						href='/'
					>
						<LogoWithBg
							className='logo'
							size={24}
							color='white'
							fillColor='var(--color_bg)'
						></LogoWithBg>
					</Link>
					<div className='nav_items flex items-center'>
						{nav_items.map(item => (
							<Item {...item} key={item.name}></Item>
						))}
					</div>
					<div className='right_wrap flex items-center justify-center'>
						<Link
							className='
								flex
								items-center justify-center
								btn_download btn_light clickable
							'
							href='/download'
						>
							{t('title.download')}
						</Link>
					</div>
				</div>
			</nav>
			<div className={$.cx('header_placeholder w-screen', styles.placeholder)}></div>
		</Fragment>
	)

	return (
		<Fragment>
			<div
				className={$.cx(
					`
					fixed
					top-0
					left-0
					box-border
					z-[1000]
					items-center justify-between
					w-screen
				`,
					styles.minibar
				)}
			>
				<Link
					className='
						flex
						items-center justify-center
						logo_wrap clickable
					'
					href='/'
				>
					<LogoWithBg
						className='logo'
						size={24}
						color='white'
						fillColor='var(--color_bg)'
					></LogoWithBg>
				</Link>
				<div
					className='
						flex
						items-center justify-center
						btn_menu clickable
					'
					onClick={toggle}
				>
					<List size={30}></List>
				</div>
				<Drawer
					rootClassName={styles.drawer}
					placement='top'
					open={open}
					maskClosable
					closeIcon={false}
					getContainer={false}
					onClose={toggle}
				>
					{Content}
				</Drawer>
			</div>
			{Content}
		</Fragment>
	)
}

export default $.memo(Index)
