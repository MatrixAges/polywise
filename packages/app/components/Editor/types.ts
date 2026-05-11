import type { TableOfContentDataItem } from '@tiptap/extension-table-of-contents'
import type { MouseEvent } from 'react'
import type Model from './model'

export interface ArgsInit extends Pick<IProps, 'id' | 'value' | 'className' | 'readonly' | 'onChange' | 'onBlur'> {}

export interface IProps {
	id: string
	value: string
	className?: string
	readonly?: boolean
	rich_text?: boolean
	text_only?: boolean
	onChange: (v: string) => void
	onBlur?: (v: string) => void
}

export interface IPropsActionBar extends Pick<IProps, 'rich_text' | 'text_only'> {
	editor: Model['editor']
	signal: Model['signal']
	focus: Model['focus']
	update: Model['update']
}

export interface IPropsMenu {
	editor: Model['editor']
	current_menu_items: Model['current_menu_items']
	latest_menu_items: Model['latest_menu_items']
	onMenuItem: Model['onMenuItem']
}

export interface IPropsMenuLatest {
	items: Array<Model['current_menu_items'][number] & { index: number }>
	onMenuItem: Model['onMenuItem']
}

export interface IPropsMenuItem {
	item: Model['current_menu_items'][number]
	index: number
	onMenuItem: Model['onMenuItem']
}

export interface IPropsModal {
	editor: Model['editor']
}

export interface Context {
	value: string
	pos: number
}

export interface IPropsModalKatex extends IPropsModal {
	context: Context & { inline?: boolean }
}

export interface IPropsModalMermaid extends IPropsModal {
	context: Context
}

export interface IPropsModalToc {
	editor: Model['editor']
	toc: Model['toc']
}

export interface IPropsModalTocItem {
	item: Model['toc'][number]
	onClick: (e: MouseEvent<HTMLAnchorElement>, id: string) => void
}

export type Toc = Array<
	Pick<TableOfContentDataItem, 'id' | 'level' | 'textContent' | 'itemIndex' | 'isActive' | 'isScrolledOver'>
>

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		modal: {
			showModal: (type: Model['modal_type'], context?: any) => ReturnType
			closeModal: () => ReturnType
		}
	}
}
