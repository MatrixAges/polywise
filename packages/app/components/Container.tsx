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
			`,
				global.setting.sidebar_collapsed && 'pl-0',
				global.setting.panel_collapsed && 'pr-0'
			)}
		>
			<div
				className={$cx(
					`
					overflow-y-hidden
					w-full h-full
					rounded-t-xl
					border-dev border-x border-t
				`,
					global.setting.sidebar_collapsed && 'rounded-tl-none',
					global.setting.panel_collapsed && 'rounded-tr-none'
				)}
			>
				<div className='h-full w-full'>{children}</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
