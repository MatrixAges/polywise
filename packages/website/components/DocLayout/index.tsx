'use client'

import { Fragment } from 'react'
import { ListBulletsIcon } from '@phosphor-icons/react'
import Sheet from '@website/components/ui/Sheet'
import { useMemoizedFn, useToggle } from '@website/hooks/ahooks'
import { Link, usePathname } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'
import md_styles from '@website/styles/markdown.module.css'

import type { Icon } from '@phosphor-icons/react'
import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	links: Array<{ name: string; path: string; Icon?: Icon; extra_path?: string }>
	not_translation?: boolean
}

const NavItems = ({
	links,
	not_translation,
	onLink
}: Pick<IProps, 'links' | 'not_translation'> & { onLink?: () => void }) => {
	const pathname = usePathname()
	const t = useTranslations('global')

	return (
		<div className={$.cx('module_items flex w-full flex-col')}>
			{links.map(({ name, path, Icon, extra_path }) => (
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
	)
}

const Index = (props: IProps) => {
	const { children, links, not_translation } = props
	const [open, { toggle }] = useToggle()
	const onLink = useMemoizedFn(() => {
		if (open) toggle()
	})

	return (
		<Fragment>
			<div className={$.cx('fixed top-0 box-border h-screen', styles._dirtree)}>
				<NavItems links={links} not_translation={not_translation} />
			</div>
			<button
				className={$.cx('fixed box-border items-center justify-center', styles.btn_menu)}
				type='button'
				onClick={toggle}
			>
				<ListBulletsIcon size={15}></ListBulletsIcon>
			</button>
			<Sheet
				rootClassName={styles.drawer}
				open={open}
				placement='left'
				maskClosable
				closeIcon={false}
				getContainer={false}
				onClose={toggle}
			>
				<div className='doc_layout_sheet h-full px-3 py-4'>
					<NavItems links={links} not_translation={not_translation} onLink={onLink} />
				</div>
			</Sheet>
			<div className={$.cx('small_limited_content_wrap', md_styles.md)}>{children}</div>
		</Fragment>
	)
}

export default $.memo(Index)
