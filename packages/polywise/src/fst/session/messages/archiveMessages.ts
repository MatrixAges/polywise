import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index) => {
	s.model_messages = []
	s.ui_messages = []
	s.ui_has_older = false
	s.ui_has_newer = false
	s.context = {} as Context
	s.archived_at = Date.now()

	await s.runing(false)
	await s.setContext({})
	await s.setState()
	await s.clearTasks()
	await s.clearPlan()

	s.sync()
}
