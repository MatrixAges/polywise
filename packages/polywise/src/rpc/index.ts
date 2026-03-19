import { r } from '../utils/trpc'
import save from './save'
import search from './search'
import setConfig from './setConfig'
import setTask from './setTask'
import test from './test'
import watchConfig from './watchConfig'
import watchTasks from './watchTasks'

export const router = r({
	save,
	search,
	test,
	watchConfig,
	setConfig,
	watchTasks,
	setTask
})

export type Router = typeof router
