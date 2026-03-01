import type { Setting } from '@/models'

export interface IPropsHeader extends Pick<Setting, 'panel_collapsed' | 'togglePanel'> {}

export interface IPropsPanel extends Pick<Setting, 'togglePanel'> {}
