import { r } from '@core/utils'

import create from './create'
import { answer, archive, clear, destroy, load, permission, setConfig, stop, unarchive } from './events'
import getList from './getList'
import getMoreList from './getMoreList'
import getSessionStatus from './getSessionStatus'
import getStatusList from './getStatusList'
import init from './init'
import pin from './pin'
import remove from './remove'
import rename from './rename'
import sortPin from './sortPin'
import unread from './unread'
import watchSessionStatus from './watchSessionStatus'

export default r({
	init,
	create,
	getList,
	getMoreList,
	getSessionStatus,
	getStatusList,
	remove,
	rename,
	pin,
	sortPin,
	stop,
	clear,
	archive,
	unarchive,
	load,
	answer,
	permission,
	setConfig,
	destroy,
	unread,
	watchSessionStatus
})
