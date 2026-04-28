import { createContext, useContext } from 'react'

import type Model from './model'

export interface IPageContext extends Pick<Model, 'init'> {}

const page_context = createContext<IPageContext | null>(null)

export const PageContext = page_context.Provider

export const usePageContext = () => {
	return useContext(page_context)!
}
