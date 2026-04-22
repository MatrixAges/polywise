import { createContext, useContext } from 'react'

import type Model from './model'

export interface IMenuContext extends Pick<
	Model,
	| 'setCurrentTab'
	| 'setSelectedSession'
	| 'startRenameGroup'
	| 'startRenameSession'
	| 'setRenameValue'
	| 'submitRename'
	| 'cancelRename'
	| 'createSession'
	| 'createGroup'
	| 'removeSession'
	| 'removeGroup'
	| 'togglePinSession'
	| 'sortGroup'
	| 'sortGroupSession'
	| 'moveSessionToGroup'
	| 'moveSessionOutGroup'
	| 'onScroll'
> {}

const menu_context = createContext<IMenuContext | null>(null)

export const MenuContext = menu_context.Provider

export const useMenuContext = () => {
	return useContext(menu_context)!
}
