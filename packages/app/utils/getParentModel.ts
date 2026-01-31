import { container } from 'tsyringe'

import { GlobalModel } from '@/context'

import type { InjectionToken } from 'tsyringe'

const Index = <T>(parent: T, Model: InjectionToken<T>) => {
	setTimeout(() => (parent = container.resolve(Model)), 0)
}

export default Index

export const getGlobal = (global: GlobalModel) => Index(global, GlobalModel)
