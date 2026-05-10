import { useMemo } from 'react'
import { Pin } from 'lucide-react'

import { ArrowLeft, Grip } from '@/components/animate'
import RenameInput from '@/pages/session/components/RenameInput'

import { useModel } from '../context'

import type { IPropsMenuSessionItem } from '../types'

const Index = (props: IPropsMenuSessionItem) => {
	const { item, session_index, selected, renaming, rename_value, title, pin, project_index, class_name, on_click } =
		props
	const { is_runing, unread } = item
	const { setRenameValue, renameSession, onCancelRename } = useModel()

	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />
		if (pin) return <Pin className='text-std-300! size-3' />

		return null
	}, [pin, is_runing, unread])

	return (
		<div
			className={$cx('click_button group', class_name, renaming && 'no_transition', selected && 'active')}
			onClick={renaming ? undefined : on_click}
			data-pin={pin ? 'true' : 'false'}
			data-project-index={project_index}
			data-session-index={session_index}
			data-id={item.id}
		>
			<div className='min-w-0 flex-1 truncate'>
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
			{Status}
		</div>
	)
}

export default $app.memo(Index)
