import { r } from '@core/utils'

import create from './create'
import createTodo from './createTodo'
import getFileDetail from './getFileDetail'
import getList from './getList'
import getMoreSessions from './getMoreSessions'
import remove from './remove'
import removeTodo from './removeTodo'
import rename from './rename'
import renameTodo from './renameTodo'
import sort from './sort'

export default r({
	getList,
	getMoreSessions,
	getFileDetail,
	create,
	remove,
	rename,
	sort,
	createTodo,
	removeTodo,
	renameTodo
})
