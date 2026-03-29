import { Workspace } from '@core/types'

import type { GlobalModel } from '@/context'
import type { Setting } from '@/models'

export interface IPropsHeader extends Pick<Setting, 'toggleSidebar' | 'togglePanel'> {
	workspaces: Array<Workspace>
	current_workspace: string
	disconnected: GlobalModel['disconnected']
}
