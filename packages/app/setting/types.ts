import type { Setting } from '@/models'
import type Model from './model'

export interface IPropsSidebar extends Pick<Setting, 'sidebar_collapsed'> {
	active: Model['active']
	toggleActive: (v: Model['active']) => void
}
