import { useMemoizedFn } from 'ahooks'
import { useLocation, useNavigate } from 'react-router'

import { nav_items } from '@/appdata'
import { Tabs } from '@/components'

const Index = () => {
	const { pathname } = useLocation()
	const navigate = useNavigate()

	const getActive = useMemoizedFn(key => pathname === `/${key}`)
	const onClick = useMemoizedFn(key => navigate(`/${key}`))

	return (
		<div
			className='
				flex
				items-center
				h-9
				gap-1.5
				text-xs
			'
		>
			<Tabs items={nav_items} active={getActive} deps={[pathname]} onClick={onClick}></Tabs>
		</div>
	)
}

export default $app.memo(Index)
