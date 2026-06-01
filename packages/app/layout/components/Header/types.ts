import type { IPropsHeader } from '@/layout/types'

export interface IPropsLeft extends Pick<
	IPropsHeader,
	'workspaces' | 'current_workspace' | 'toggleSidebar' | 'update_status' | 'downloadUpdate'
> {}
export interface IPropsRight extends Pick<IPropsHeader, 'disconnected' | 'togglePanel'> {}
