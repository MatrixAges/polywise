import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import type { PropsWithChildren } from 'react'

const Index = ({ children }: PropsWithChildren) => {
	const global = useGlobal()

	return (
		<div
			className={$cx(
				`
				overflow-x-hidden
				flex flex-1
				h-full
				px-2
				border-dev border-l border-t
			`,
				!global.setting.sidebar_collapsed && 'rounded-tl-2xl'
			)}
		>
			<div
				className='
					overflow-y-hidden
					w-full h-full
				'
			>
				<div className='h-full w-full'>{children}</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
