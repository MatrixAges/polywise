import { r } from '@core/utils'

import create from './create'
import createSchedule from './createSchedule'
import extract from './extract'
import fetch from './fetch'
import getContentProviders from './getContentProviders'
import getSchedules from './getSchedules'
import installContentProvider from './installContentProvider'
import manageContentProvider from './manageContentProvider'
import query from './query'
import read from './read'
import remove from './remove'
import removeSchedule from './removeSchedule'
import runBatch from './runBatch'
import update from './update'
import updateSchedule from './updateSchedule'

export default r({
	create,
	createSchedule,
	extract,
	getContentProviders,
	getSchedules,
	fetch,
	installContentProvider,
	manageContentProvider,
	query,
	read,
	remove,
	removeSchedule,
	update,
	updateSchedule,
	runBatch
})
