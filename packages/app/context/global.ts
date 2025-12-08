import { createContext, useContext } from 'react'

import Model from '../models/global'

// @ts-ignore Avoid duplicate declarations
const GlobalContext = createContext<Model>()

export const GlobalProvider = GlobalContext.Provider

export const useGlobal = () => useContext(GlobalContext)

export { Model as GlobalModel }
