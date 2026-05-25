'use client'

import { Fragment } from 'react'
import { List } from '@phosphor-icons/react'
import { medias } from '@website/appdata/app'
import LogoWithBg from '@website/components/LogoWithBg'
import Sheet from '@website/components/ui/Sheet'
import { useToggle } from '@website/hooks/ahooks'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import Item from './Item'
import nav_items from './nav_items'

import styles from './index.module.css'

const MobileMenu = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslations('layout')

	return (
		<div
			className='
				flex flex-col
				px-6 pt-16
				pb-6
			'
		>
			<div className='flex flex-col'>
				{nav_items.map(item => (
					<Link
						className='
							py-3
							text-sm text-[var(--color_text_sub)]
							border-b border-dashed border-[var(--color_border_light)]
							last:border-b-0
						'
						href={item.path}
						key={item.name}
						onClick={onClose}
					>
						{t(`title.${item.name}`)}
					</Link>
				))}
			</div>
			<Link
				className='
					flex
					items-center justify-center
					h-10
					mt-5
					btn_download btn_light
				'
				href={medias.github}
				target='_blank'
				onClick={onClose}
			>
				{t('title.github')}
			</Link>
		</div>
	)
}

const Index = () => {
	const [open, { toggle }] = useToggle()
	const t = useTranslations('layout')

	return (
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
							href={medias.github}
							target='_blank'
						>
							{t('title.github')}
						</Link>
					</div>
				</div>
			</nav>
			<div className={$.cx('header_placeholder w-screen', styles.placeholder)}></div>
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
				<button
					className='
						flex
						items-center justify-center
						btn_menu clickable
					'
					type='button'
					onClick={toggle}
				>
					<List size={30}></List>
				</button>
			</div>
			<Sheet
				rootClassName={styles.drawer}
				open={open}
				placement='top'
				maskClosable
				closeIcon={false}
				getContainer={false}
				onClose={toggle}
			>
				<MobileMenu onClose={toggle} />
			</Sheet>
		</Fragment>
	)
}

export default $.memo(Index)
