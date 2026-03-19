import { r } from '../utils/trpc'
import save from './save'
import setConfig from './setConfig'
import test from './test'
import watchConfig from './watchConfig'

export const router = r({
	save,
	test,
	watchConfig,
	setConfig
})

export type Router = typeof router
