import { memo } from '@/utils'

import type { IPropsContent } from '../../types'

const Index = (props: IPropsContent) => {
	const {} = props

	return (
		<div
			className='
				flex
				w-[320px] h-full
				rounded-xl
				bg-std-white
				dark:bg-std-200/30!
				glass:bg-std-white/48
			'
		></div>
	)
}

export default memo(Index)
