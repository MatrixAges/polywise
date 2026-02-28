import { useState } from 'react'
import { PanelRight } from 'lucide-react'

import { panel_tabs } from '@/appdata'
import { memo } from '@/utils'

import type { IPropsPanel } from '../layout/types'

const Index = (props: IPropsPanel) => {
	const { togglePanel } = props
	const [active_tab, set_active_tab] = useState('agent')

	return (
		<div className='flex h-full w-full flex-col'>
			<div
				className='
					flex
					items-center justify-between
					h-[42px]
					px-2.5
					is_drag
				'
			>
				<div
					className='
						flex
						items-center
						h-9
						gap-1.5
						text-xs
					'
				>
					{panel_tabs.map(({ key, Icon }) => (
						<div
							className={$cx(
								`
								flex
								items-center justify-center
								h-7
								gap-1
								rounded-full
								hover:bg-std-100
								clickable
							`,
								active_tab === key
									? 'text-std-black bg-std-100 px-2'
									: 'text-std-400 w-7'
							)}
							key={key}
							onClick={() => set_active_tab(key)}
						>
							<Icon size={14} />
							{active_tab === key && <span className='capitalize'>{key}</span>}
						</div>
					))}
				</div>
				<div className='icon_button' onClick={togglePanel}>
					<PanelRight />
				</div>
			</div>
		</div>
	)
}

export default memo(Index)
