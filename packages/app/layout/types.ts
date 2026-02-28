import type { Settings } from '@/models'

export interface IPropsHeader extends Pick<Settings, 'panel_collapsed' | 'togglePanel'> {}

export interface IPropsPanel extends Pick<Settings, 'togglePanel'> {}
