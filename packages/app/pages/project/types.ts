import type Model from './model'

export interface IPropsMenu extends Pick<Model, 'projects'> {}

export interface IPropsMenuItem {
	item: Model['projects'][number]
	index: number
}
