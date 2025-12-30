import { memo } from '@/utils'

import type { IPropsContent } from '../../types'

const Index = (props: IPropsContent) => {
	const { glass } = props

	return (
		<div
			className={$cx(
				`
				flex
				w-[320px] h-full
				rounded-xl
				dark:bg-std-200/30
			`,
				glass ? 'bg-std-white/48' : 'bg-std-white'
			)}
		></div>
	)
}

export default memo(Index)
