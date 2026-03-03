import type { IPropsHeader } from '@/layout/types'

export interface IPropsLeft extends Pick<IPropsHeader, 'toggleSidebar'> {}
export interface IPropsRight extends Pick<IPropsHeader, 'togglePanel'> {}
