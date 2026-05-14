import { r } from '../utils/trpc'
import agent from './agent'
import file from './file'
import group from './group'
import heartbeat from './heartbeat'
import linkcase from './linkcase'
import llama from './llama'
import notification from './notification'
import pipeline from './pipeline'
import project from './project'
import provider from './provider'
import remove from './remove'
import save from './save'
import search from './search'
import session from './session'
import setActive from './setActive'
import skill from './skill'
import test from './test'
import todo from './todo'
import tool from './tool'
import update from './update'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

export const router = r({
	agent,
	group,
	file,
	linkcase,
	project,
	skill,
	tool,
	todo,
	session,
	provider,
	pipeline,
	notification,
	llama,
	heartbeat,
	search,
	save,
	setActive,
	test,
	update,
	remove
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
