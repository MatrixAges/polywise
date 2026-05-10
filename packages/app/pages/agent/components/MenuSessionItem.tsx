import { useMemo } from 'react'

import { ArrowLeft, Grip } from '@/components/animate'
import RenameInput from '@/pages/session/components/RenameInput'
import { fromNow } from '@/utils'

import { useModel } from '../context'

import type { IAgentMenuSessionItemProps } from '../types'

const Index = (props: IAgentMenuSessionItemProps) => {
	const { item, session_index, selected, renaming, rename_value, title, pin, class_name, onClick } = props
	const { is_runing, unread, updated_at } = item
	const { setRenameValue, renameSession, onCancelRename } = useModel()

	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='size-3 text-indigo-500!' />

		return null
	}, [is_runing, unread])

	return (
		<div
			className={$cx(
				`
				flex flex-col
				items-start
				gap-1
				px-3 py-2.5
				rounded-xl
				group
				click_button
			`,
				class_name,
				renaming && 'no_transition',
				selected && 'active'
			)}
			onClick={renaming ? undefined : onClick}
			data-pin={pin ? 'true' : 'false'}
			data-session-index={session_index}
			data-id={item.id}
		>
			<div className='w-full truncate'>
				{renaming ? (
					<RenameInput
						active={renaming}
						value={rename_value}
						set_rename_value={setRenameValue}
						submit_rename={renameSession}
						cancel_rename={onCancelRename}
					></RenameInput>
				) : (
					title || <span className='truncate'>{item.title}</span>
				)}
			</div>
			<div
				className='
					flex
					items-center justify-between
					w-full
					text-std-400 text-xs
				'
			>
				<span>{fromNow(updated_at)}</span>
				{Status}
			</div>
		</div>
	)
}

export default $app.memo(Index)
