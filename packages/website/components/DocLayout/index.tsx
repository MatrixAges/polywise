'use client'

import { Fragment } from 'react'
import { ListBullets } from '@phosphor-icons/react'
import { useMemoizedFn, useToggle } from '@website/hooks/ahooks'
import { Link, usePathname } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { Drawer } from 'antd'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'
import md_styles from '@website/styles/markdown.module.css'

import type { Icon } from '@phosphor-icons/react'
import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	links: Array<{ name: string; path: string; Icon?: Icon; extra_path?: string }>
	not_translation?: boolean
}

const Index = (props: IProps) => {
	const { children, links, not_translation } = props
	const pathname = usePathname()
	const t = useTranslations('global')
	const [open, { toggle }] = useToggle()

	const onLink = useMemoizedFn(() => {
		if (open) toggle()
	})

	const Content = (
		<div className={$.cx('fixed top-0 box-border h-screen', styles._dirtree)}>
			<div className={$.cx('module_items flex w-full flex-col')}>
				{links.map(({ name, path, Icon, extra_path }, index) => (
					<Link
						href={path}
						className={$.cx(
							`
							box-border
							flex
							items-center
							w-full
							module_item clickable
						`,
							(pathname === path || pathname === extra_path) && 'active'
						)}
						key={name}
						onClick={onLink}
					>
						{Icon && (
							<span
								className='
									flex
									items-center justify-center
									mr-1
									icon_wrap
								'
							>
								<Icon className='icon' size={18}></Icon>
							</span>
						)}
						<span className='name'>{not_translation ? name : t(name)}</span>
					</Link>
				))}
			</div>
		</div>
	)

	return (
		<Fragment>
			{/* <style>{`body{ padding-left: calc(var(--sidebar_width) + var(--dirtree_width)) !important; }`}</style> */}
			{Content}
			<button
				className={$.cx('fixed box-border items-center justify-center', styles.btn_menu)}
				onClick={toggle}
			>
				<ListBullets size={15}></ListBullets>
			</button>
			<div className={styles.drawer_wrap}>
				<Drawer
					rootClassName={styles.drawer}
					placement='left'
					open={open}
					closeIcon={false}
					getContainer={false}
					onClose={toggle}
				>
					{Content}
				</Drawer>
			</div>
			<div className={$.cx('small_limited_content_wrap', md_styles.md)}>{children}</div>
		</Fragment>
	)
}

export default $.memo(Index)
