import EntityAvatar from './EntityAvatar'

import type { AgentItem, GroupItem } from '../model'

interface IProps {
	agent?: AgentItem | null
	group?: GroupItem | null
	compact?: boolean
}

const Index = ({ agent, group, compact = false }: IProps) => {
	const avatar_size = compact ? 32 : 36
	const agent_photo = agent?.photo as Uint8Array | null | undefined
	const group_photo = group?.photo as Uint8Array | null | undefined

	if (agent) {
		return (
			<div
				className='
					flex
					items-center justify-start
					w-full
					min-w-0
					gap-3
					text-left
				'
			>
				<EntityAvatar
					name={agent.name}
					photo={agent_photo ?? null}
					avatar={agent.avatar ?? null}
					size={avatar_size}
				/>
				<div
					className='
						flex flex-1 flex-col
						items-start
						min-w-0
						text-left
					'
				>
					<div className='truncate text-sm font-medium'>{agent.name}</div>
					<div className='text-std-500 truncate text-xs'>{agent.role || 'No role'}</div>
				</div>
			</div>
		)
	}

	if (group) {
		return (
			<div
				className='
					flex
					items-center justify-start
					w-full
					min-w-0
					gap-3
					text-left
				'
			>
				<EntityAvatar name={group.name} photo={group_photo ?? null} avatar={null} size={avatar_size} />
				<div
					className='
						flex flex-1 flex-col
						items-start
						min-w-0
						text-left
					'
				>
					<div className='truncate text-sm font-medium'>{group.name}</div>
					<div className='text-std-500 truncate text-xs'>
						{group.description || `${group.agents.length} agents`}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div
			className={
				compact
					? 'text-std-400 text-xs'
					: ['px-3 py-2', 'rounded-2xl', 'text-std-400 text-sm', 'bg-muted/35', 'border'].join(' ')
			}
		>
			Nothing selected yet
		</div>
	)
}

export default $app.memo(Index)
