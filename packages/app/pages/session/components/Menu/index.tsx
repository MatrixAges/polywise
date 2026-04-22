import { useDelegate } from '@/hooks'

import { useMenuContext } from '../../context'
import { Groups, Sessions } from './components'

import type { IPropsGroups, IPropsMenu, IPropsSessions } from '../../types'

const Index = (props: IPropsMenu) => {
	const {
		current_tab,
		groups,
		sessions,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_id,
		rename_value
	} = props
	const { setCurrentTab } = useMenuContext()

	const props_groups: IPropsGroups = {
		groups,
		pin_map,
		selected_session_id,
		rename_group_index,
		rename_session_id,
		rename_value
	}

	const props_sessions: IPropsSessions = {
		groups,
		sessions,
		pin_map,
		selected_session_id,
		rename_session_id,
		rename_value
	}

	const ref = useDelegate(v => setCurrentTab(v), { item_type: 'span' })

	return (
		<div
			className='
				overflow-hidden
				flex flex-none flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center
					px-3 pt-2
					pb-1
				'
			>
				<div
					className='
						flex
						items-center
						text-xsm text-std-400 font-medium
					'
					ref={ref}
				>
					<span
						className={$cx(
							`
							px-1 py-0.5
							border-b border-transparent
							clickable
						`,
							current_tab === 'group' && 'text-std-800'
						)}
						data-key='group'
					>
						Group
					</span>
					<span
						className={$cx(
							`
							px-1 py-0.5
							border-b border-transparent
							clickable
						`,
							current_tab === 'session' && 'text-std-800'
						)}
						data-key='session'
					>
						Session
					</span>
				</div>
			</div>
			{current_tab === 'session' ? (
				<Sessions {...props_sessions}></Sessions>
			) : (
				<Groups {...props_groups}></Groups>
			)}
		</div>
	)
}

export default $app.memo(Index)
