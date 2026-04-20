import { r } from '@core/utils'

import create from './create'
import createGroup from './createGroup'
import { answer, archive, clear, destroy, load, permission, stop, unarchive } from './events'
import init from './init'
import moveOutGroup from './moveOutGroup'
import moveToGroup from './moveToGroup'
import pin from './pin'
import remove from './remove'
import removeGroup from './removeGroup'
import rename from './rename'
import renameGroup from './renameGroup'
import sortGroup from './sortGroup'

export default r({
	init,
	create,
	remove,
	rename,
	pin,
	createGroup,
	moveToGroup,
	moveOutGroup,
	removeGroup,
	sortGroup,
	renameGroup,
	stop,
	clear,
	archive,
	unarchive,
	load,
	answer,
	permission,
	destroy
})
