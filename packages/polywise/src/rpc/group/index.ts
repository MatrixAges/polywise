import { r } from '@core/utils'

import create from './create'
import createSession from './createSession'
import getSessions from './getSessions'
import query from './query'
import remove from './remove'
import setAgents from './setAgents'
import todo from './todo'
import update from './update'

export default r({
	create,
	createSession,
	getSessions,
	query,
	remove,
	setAgents,
	todo,
	update
})
