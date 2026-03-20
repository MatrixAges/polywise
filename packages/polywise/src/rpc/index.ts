import { r } from '../utils/trpc'
import remove from './remove'
import save from './save'
import search from './search'
import setConfig from './setConfig'
import setTask from './setTask'
import test from './test'
import update from './update'
import watchConfig from './watchConfig'
import watchTasks from './watchTasks'

export const router = r({
	save,
	search,
	test,
	watchConfig,
	setConfig,
	watchTasks,
	setTask,
	update,
	remove
})

export type Router = typeof router
