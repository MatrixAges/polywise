import type { GlobalModel } from '@/context'
import type { Setting } from '@/models'

export interface IPropsHeader extends Pick<Setting, 'toggleSidebar' | 'togglePanel'> {
	disconnected: GlobalModel['disconnected']
}
