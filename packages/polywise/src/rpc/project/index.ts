import { r } from '@core/utils'

import create from './create'
import getFileDetail from './getFileDetail'
import getList from './getList'
import getMoreSessions from './getMoreSessions'
import remove from './remove'
import rename from './rename'
import sort from './sort'

export default r({
	getList,
	getMoreSessions,
	getFileDetail,
	create,
	remove,
	rename,
	sort
})
