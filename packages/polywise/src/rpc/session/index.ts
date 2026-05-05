import { r } from '@core/utils'

import create from './create'
import createGroup from './createGroup'
import { answer, archive, clear, destroy, load, permission, setConfig, stop, unarchive } from './events'
import getList from './getList'
import getMoreList from './getMoreList'
import getStatusList from './getStatusList'
import init from './init'
import moveOutGroup from './moveOutGroup'
import moveToGroup from './moveToGroup'
import pin from './pin'
import remove from './remove'
import removeGroup from './removeGroup'
import rename from './rename'
import renameGroup from './renameGroup'
import sortGroup from './sortGroup'
import sortGroupSession from './sortGroupSession'
import unread from './unread'
import watchSessionStatus from './watchSessionStatus'

export default r({
	init,
	create,
	getList,
	getMoreList,
	getStatusList,
	remove,
	rename,
	pin,
	createGroup,
	moveToGroup,
	moveOutGroup,
	removeGroup,
	sortGroup,
	sortGroupSession,
	renameGroup,
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
