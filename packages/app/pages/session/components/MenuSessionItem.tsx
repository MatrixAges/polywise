import { useMemo } from 'react'
import { Bubbles } from 'lucide-react'

import { ArrowLeft, Grip } from '@/components/animate'
import RenameInput from '@/pages/session/components/RenameInput'
import { fromNow } from '@/utils'

import { useModel } from '../context'

import type { IPropsMenuSessionItem } from '../types'

const Index = (props: IPropsMenuSessionItem) => {
	const { item, session_index, selected, renaming, rename_value, title, pin, project_index, class_name, onClick } =
		props
	const { is_runing, unread, updated_at } = item
	const { setRenameValue, renameSession, onCancelRename } = useModel()

	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-2.5' />
		if (unread) return <ArrowLeft className='size-2.5 text-indigo-500!' />

		return <Bubbles className='text-std-400 size-2.5' />
	}, [pin, is_runing, unread])

	return (
		<div
			className={$cx(
				`
				flex flex-col
				items-start
				w-full
				gap-1
				py-2
				rounded-sm
				group
				click_button
			`,
				class_name,
				renaming && 'no_transition',
				selected && 'active'
			)}
			onClick={renaming ? undefined : onClick}
			data-pin={pin ? 'true' : 'false'}
			data-project-index={project_index}
			data-session-index={session_index}
			data-id={item.id}
		>
			<div
				className='
					flex
					items-center
					w-full
					gap-1.5
				'
			>
				<div className='flex shrink-0'>{Status}</div>
				<div
					className='
						flex flex-1
						truncate
					'
				>
					{renaming ? (
						<RenameInput
							active={renaming}
							value={rename_value}
							set_rename_value={setRenameValue}
							submit_rename={renameSession}
							cancel_rename={onCancelRename}
						></RenameInput>
					) : (
						<span className='truncate'>{item.title}</span>
					)}
				</div>
			</div>
			<div
				className='
					flex
					items-center justify-between
					w-full
					pl-4.5
					text-std-400 text-xs font-normal
				'
			>
				<span>{fromNow(updated_at)}</span>
			</div>
		</div>
	)
}

export default $app.memo(Index)
