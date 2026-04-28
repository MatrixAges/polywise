import { useMemo } from 'react'
import { Pin } from 'lucide-react'

import { ArrowLeft, Grip } from '@/components/animate'
import RenameInput from '@/pages/session/components/RenameInput'

import { useModel } from '../context'

import type { IPropsSessionItem } from '../types'

const Index = (props: IPropsSessionItem) => {
	const {
		item,
		project_id,
		project_index,
		session_index,
		selected,
		renaming = false,
		rename_value = '',
		pin = false
	} = props
	const { title, unread } = item
	const { setSelectedProject, setSelectedSession } = useModel()

	const status = useMemo(() => {
		if (item.is_runing) return <Grip className='text-std-400! size-3' />
		if (unread) return <ArrowLeft className='text-std-300! size-3' />
		if (pin) return <Pin className='text-std-300! size-3' />

		return null
	}, [item.is_runing, pin, unread])

	const onClick = () => {
		if (renaming) return

		setSelectedProject(project_id)
		setSelectedSession(item.id)
	}

	return (
		<div
			className={$cx('click_button group', renaming && 'no_transition', selected && 'active')}
			onClick={onClick}
			data-project-index={project_index}
			data-session-index={session_index}
			data-id={item.id}
		>
			<div className='min-w-0 flex-1'>
				{renaming ? (
					<RenameInput
						active={renaming}
						value={rename_value}
						setRenameValue={() => {}}
						submitRename={() => {}}
						cancelRename={() => {}}
					></RenameInput>
				) : (
					<span className='truncate'>{title}</span>
				)}
			</div>
			{status}
		</div>
	)
}

export default $app.memo(Index)
