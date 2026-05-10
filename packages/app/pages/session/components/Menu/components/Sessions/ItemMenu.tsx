import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/__shadcn__/components/ui/context-menu'
import { useModel } from '@/pages/session/context'

import type { IPropsSessionItemMenu } from './types'

const Index = (props: IPropsSessionItemMenu) => {
	const { item, pin, sessionIndex } = props
	const { createSession, startRenameSession, togglePinSession, removeSession } = useModel()

	return (
		<ContextMenuContent>
			<ContextMenuItem onClick={createSession}>New Session</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem
				onClick={() =>
					startRenameSession({
						pin,
						session_index: sessionIndex,
						value: item.title
					})
				}
			>
				Rename
			</ContextMenuItem>
			<ContextMenuItem onClick={() => togglePinSession(item.id)}>{pin ? 'Unpin' : 'Pin'}</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem variant='destructive' onClick={() => removeSession(item.id)}>
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	)
}

export default $app.memo(Index)
