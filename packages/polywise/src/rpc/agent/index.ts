import { r } from '@core/utils'

import create from './create'
import createSession from './createSession'
import getSessions from './getSessions'
import query from './query'
import remove from './remove'
import sort from './sort'
import update from './update'

export default r({
	create,
	createSession,
	getSessions,
	remove,
	query,
	sort,
	update
})
