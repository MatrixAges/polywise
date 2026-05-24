import { useMemo } from 'react'
import { Link, usePathname } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import type { NavItem } from '../types'

const Index = (props: NavItem) => {
	const { name, path, badge } = props
	const pathname = usePathname()
	const t = useTranslations('layout')

	const active = useMemo(() => pathname === path, [pathname, path])

	return (
		<Link
			href={path}
			className={$.cx(
				`
				relative
				box-border
				flex flex-col
				items-center justify-center
				nav_item clickable
			`,
				active && 'active'
			)}
		>
			{badge && <span className='badge absolute'>{badge}</span>}
			<span className='nav_item_title'>{t(`title.${name}`)}</span>
		</Link>
	)
}

export default $.memo(Index)
