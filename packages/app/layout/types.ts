import { Workspace } from '@core/types'

import type { GlobalModel } from '@/context'
import type { Setting } from '@/models'
import type { UpdateState } from '@/types/app'

export interface IPropsHeader extends Pick<Setting, 'toggleSidebar' | 'togglePanel'> {
	workspaces: Array<Workspace>
	current_workspace: string
	disconnected: GlobalModel['disconnected']
	update_status: UpdateState
	downloadUpdate: GlobalModel['downloadUpdate']
}
