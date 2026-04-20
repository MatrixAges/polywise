import { useMemoizedFn } from 'ahooks'

import type { IPropsGroups } from '../../../types'

const Index = (props: IPropsGroups) => {
	const { groups, selected_session_id, setSelectedSession } = props
	const handleSelectSession = useMemoizedFn((id: string) => setSelectedSession(id))

	return (
		<div
			className='
				flex flex-col
				gap-2
				p-3
				border-b
			'
		>
			{groups.map(group_item => (
				<div className='flex flex-col gap-2' key={group_item.group}>
					<div className='text-sm font-medium'>{group_item.group}</div>
					<div className='flex flex-col gap-1'>
						{group_item.items.map(item => {
							const onClick = () => handleSelectSession(item.id)

							return (
								<button
									className={$cx(
										'rounded-md px-3 py-2 text-left',
										selected_session_id === item.id && 'bg-muted'
									)}
									onClick={onClick}
									key={item.id}
								>
									{item.title}
								</button>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}

export default $app.memo(Index)
