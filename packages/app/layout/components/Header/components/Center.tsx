import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { nav_items } from '@/appdata'
import { Tabs } from '@/components'

const getNavTitle = (args: { title?: string; t: (key: string, options?: Record<string, unknown>) => string }) => {
	const { title, t } = args

	switch (title) {
		case 'home':
			return t('nav.home')
		case 'session':
			return t('nav.session')
		case 'agent':
			return t('nav.agent')
		case 'linkcase':
			return t('nav.linkcase')
		case 'post':
			return t('nav.post')
		default:
			return title
	}
}

const Index = () => {
	const { t: raw_t } = useTranslation('layout')
	const t = raw_t as unknown as (key: string, options?: Record<string, unknown>) => string
	const { pathname } = useLocation()
	const navigate = useNavigate()

	const getActive = useMemoizedFn(key => {
		if (!key) {
			return pathname === '/'
		}

		const base_path = `/${key}`

		return pathname === base_path || pathname.startsWith(`${base_path}/`)
	})
	const onClick = useMemoizedFn(key => navigate(`/${key}`))

	return (
		<div
			data-page-tabs='nav'
			className='
				flex
				items-center
				h-9
				gap-1.5
				text-xs
				no_drag
			'
		>
			<Tabs
				items={nav_items.map(item => ({
					...item,
					title: getNavTitle({ title: item.title, t })
				}))}
				active={getActive}
				deps={[pathname]}
				under
				onClick={onClick}
			></Tabs>
		</div>
	)
}

export default $app.memo(Index)
