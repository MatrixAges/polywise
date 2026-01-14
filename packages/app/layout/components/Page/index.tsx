import Home from '@/pages/home'
import { memo } from '@/utils'

import type { IPropsPage } from '../../types'

const Index = (props: IPropsPage) => {
	const {} = props

	return (
		<div
			className='
				flex flex-1
				bg-std-100
			'
		>
			<Home></Home>
		</div>
	)
}

export default memo(Index)
