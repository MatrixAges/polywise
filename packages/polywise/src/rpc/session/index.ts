import { r } from '@core/utils'

import create from './create'
import { answer, archive, clear, destroy, load, permission, removeMessage, setConfig, stop, unarchive } from './events'
import getFilesDir from './getFilesDir'
import getList from './getList'
import getMentionFiles from './getMentionFiles'
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
	getFilesDir,
	getMentionFiles,
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
	removeMessage,
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
