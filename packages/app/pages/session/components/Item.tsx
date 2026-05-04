import { useMemo } from 'react'
import { Pin } from 'lucide-react'

import { ArrowLeft, Grip } from '@/components/animate'

import { useModel } from '../context'
import RenameInput from './RenameInput'

import type { Session } from '@core/db'
import type { CSSProperties, ReactNode } from 'react'

interface IProps {
	item: Session
	pin: boolean
	selected: boolean
	renaming: boolean
	rename_value: string
	title: ReactNode
	group_index: number
	session_index: number
	className?: string
	style?: CSSProperties
}

const Index = (props: IProps) => {
	const { item, pin, selected, renaming, rename_value, title, group_index, session_index, className, style } = props
	const { is_runing, unread } = item
	const { setSelectedSession, setRenameValue, submitRename, cancelRename } = useModel()

	const Status = useMemo(() => {
		if (is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />
		if (pin) return <Pin className='text-std-300! size-3' />

		return null
	}, [pin, is_runing, unread])

	return (
		<div
			className={$cx('click_button group', className, renaming && 'no_transition', selected && 'active')}
			style={style}
			onClick={renaming ? undefined : () => setSelectedSession(item.id)}
			data-group-index={group_index}
			data-session-index={session_index}
			data-id={item.id}
		>
			<div className='min-w-0 flex-1 truncate'>
				{renaming ? (
					<RenameInput
						active={renaming}
						value={rename_value}
						setRenameValue={setRenameValue}
						submitRename={submitRename}
						cancelRename={cancelRename}
					></RenameInput>
				) : (
					title
				)}
			</div>
			{Status}
		</div>
	)
}

export default $app.memo(Index)
