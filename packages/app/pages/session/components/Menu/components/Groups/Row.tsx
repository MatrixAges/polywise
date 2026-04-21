import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pin } from 'lucide-react'

import { ContextMenu, ContextMenuTrigger } from '@/__shadcn__/components/ui/context-menu'
import RenameInput from '@/pages/session/components/RenameInput'

import RowMenu from './RowMenu'

import type { IPropsGroupSessionRow } from './types'

const Index = (props: IPropsGroupSessionRow) => {
	const {
		group_index,
		session_index,
		item,
		group_items_count,
		groups,
		pin_map,
		selected_session_id,
		rename_session_id,
		rename_value,
		setSelectedSession,
		startRenameSession,
		setRenameValue,
		submitRename,
		cancelRename,
		createSession,
		createGroup,
		removeSession,
		togglePinSession,
		sortGroupSession,
		moveSessionToGroup,
		moveSessionOutGroup
	} = props

	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id })
	const active_rename = rename_session_id === item.id

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={$cx(
						`
						flex
						items-center
						gap-2
						px-3 py-2
						rounded-md
						text-sm
						text-left
						group
					`,
						selected_session_id === item.id && 'bg-muted'
					)}
					style={{ transform: CSS.Translate.toString(transform), transition }}
					onClick={() => setSelectedSession(item.id)}
					ref={setNodeRef}
				>
					<button
						className='
							text-muted-foreground
							opacity-0
							transition-opacity
							group-hover:opacity-100
							cursor-grab
						'
						type='button'
						{...attributes}
						{...listeners}
					>
						⋮⋮
					</button>
					{pin_map[item.id] && <Pin size={12} className='text-amber-500' />}
					<div className='min-w-0 flex-1'>
						{active_rename ? (
							<RenameInput
								active={active_rename}
								value={rename_value}
								setRenameValue={setRenameValue}
								submitRename={submitRename}
								cancelRename={cancelRename}
							></RenameInput>
						) : (
							<span className='truncate'>{item.title}</span>
						)}
					</div>
				</div>
			</ContextMenuTrigger>
			<RowMenu
				group_index={group_index}
				session_index={session_index}
				group_items_count={group_items_count}
				item={item}
				groups={groups}
				pin_map={pin_map}
				startRenameSession={startRenameSession}
				createSession={createSession}
				createGroup={createGroup}
				removeSession={removeSession}
				togglePinSession={togglePinSession}
				sortGroupSession={sortGroupSession}
				moveSessionToGroup={moveSessionToGroup}
				moveSessionOutGroup={moveSessionOutGroup}
			></RowMenu>
		</ContextMenu>
	)
}

export default $app.memo(Index)
