import { setting_items } from '@/appdata'

import type { IPropsSidebar } from './types'

const Index = (props: IPropsSidebar) => {
	const { sidebar_collapsed, active, toggleActive } = props

	if (sidebar_collapsed) return null

	return (
		<div
			className='
				overflow-y-scroll
				flex
				w-[160px] h-full
			'
		>
			<div
				className='
					flex flex-col
					w-full
					gap-1
					p-2
					pb-12
				'
			>
				<span
					className='
						flex
						items-center
						px-2.5 py-1.5
						text-xs text-muted-foreground
						label
					'
				>
					Settings
				</span>
				{setting_items.map(({ key, Icon }) => (
					<div
						className={`
							click_button
							${active === key && 'active'}
                              `}
						key={key}
						onClick={() => toggleActive(key)}
					>
						<Icon></Icon>
						<span className='capitalize'>{key}</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)
