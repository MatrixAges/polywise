import { FolderPlus, Plus } from 'lucide-react'

import { Tooltip } from '@/components'
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
	const { setCurrentTab, createSession, createGroup } = useMenuContext()

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

	const ref_tab = useDelegate(v => setCurrentTab(v), { item_type: 'span' })

	const ref_action = useDelegate(v => {
		setCurrentTab(v)

		if (v === 'group') {
			createGroup()
		} else {
			createSession()
		}
	})

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
					items-center justify-between
					px-3 py-1.5
				'
			>
				<div
					className='
						flex
						items-center
						text-xsm text-std-400 font-medium
					'
					ref={ref_tab}
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
				<div className='flex gap-1' ref={ref_action}>
					<Tooltip title='New Group'>
						<div className='icon_button small' data-key='group'>
							<FolderPlus></FolderPlus>
						</div>
					</Tooltip>
					<Tooltip title='New Session'>
						<div className='icon_button small' data-key='session'>
							<Plus></Plus>
						</div>
					</Tooltip>
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
