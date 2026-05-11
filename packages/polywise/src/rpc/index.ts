import { r } from '../utils/trpc'
import agent from './agent'
import file from './file'
import fullTextSearch from './fullTextSearch'
import heartbeat from './heartbeat'
import inspect from './inspect'
import llama from './llama'
import notification from './notification'
import pipeline from './pipeline'
import project from './project'
import provider from './provider'
import remove from './remove'
import save from './save'
import SemanticSearch from './SemanticSearch'
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
	file,
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
	inspect,
	fullTextSearch,
	save,
	SemanticSearch,
	setActive,
	test,
	update,
	remove
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
