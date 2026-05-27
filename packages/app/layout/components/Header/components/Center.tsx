import { useMemoizedFn } from 'ahooks'
import { useLocation, useNavigate } from 'react-router'

import { nav_items } from '@/appdata'
import { Tabs } from '@/components'

const Index = () => {
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
			<Tabs items={nav_items} active={getActive} deps={[pathname]} under onClick={onClick}></Tabs>
		</div>
	)
}

export default $app.memo(Index)
