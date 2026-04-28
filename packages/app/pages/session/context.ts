import { createContext, useContext } from 'react'

import type Model from './model'

const context = createContext<Model | null>(null)

export const Context = context.Provider

export const useModel = () => {
	return useContext(context)!
}
