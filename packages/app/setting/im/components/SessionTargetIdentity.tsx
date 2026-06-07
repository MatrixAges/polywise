import { useTranslation } from 'react-i18next'

import EntityAvatar from './EntityAvatar'

import type { AgentItem, GroupItem } from '../model'

interface IProps {
	agent?: AgentItem | null
	group?: GroupItem | null
	compact?: boolean
}

const Index = ({ agent, group, compact = false }: IProps) => {
	const { t } = useTranslation('setting')
	const avatar_size = compact ? 32 : 36
	const agent_photo = agent?.photo as Uint8Array | null | undefined
	const group_photo = group?.photo as Uint8Array | null | undefined

	if (agent) {
		return (
			<div
				className='
					overflow-hidden
					flex
					items-center justify-start
					w-full max-w-full
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
						overflow-hidden
						flex flex-1 flex-col
						items-start
						w-full max-w-full
						min-w-0
						text-left
					'
				>
					<div
						className='
							w-full
							min-w-0
							text-sm font-medium
							truncate
						'
					>
						{agent.name}
					</div>
					<div
						className='
							w-full
							min-w-0
							text-std-500 text-xs
							truncate
						'
					>
						{agent.role || t('im.no_role')}
					</div>
				</div>
			</div>
		)
	}

	if (group) {
		return (
			<div
				className='
					overflow-hidden
					flex
					items-center justify-start
					w-full max-w-full
					min-w-0
					gap-3
					text-left
				'
			>
				<EntityAvatar name={group.name} photo={group_photo ?? null} avatar={null} size={avatar_size} />
				<div
					className='
						overflow-hidden
						flex flex-1 flex-col
						items-start
						w-full max-w-full
						min-w-0
						text-left
					'
				>
					<div
						className='
							w-full
							min-w-0
							text-sm font-medium
							truncate
						'
					>
						{group.name}
					</div>
					<div
						className='
							w-full
							min-w-0
							text-std-500 text-xs
							truncate
						'
					>
						{group.description || t('im.agents_count', { count: group.agents.length })}
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
			{t('im.nothing_selected')}
		</div>
	)
}

export default $app.memo(Index)
