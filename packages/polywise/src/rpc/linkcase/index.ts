import { r } from '@core/utils'

import create from './create'
import extract from './extract'
import fetch from './fetch'
import getContentProviders from './getContentProviders'
import installContentProvider from './installContentProvider'
import manageContentProvider from './manageContentProvider'
import query from './query'
import read from './read'
import remove from './remove'
import runBatch from './runBatch'
import update from './update'

export default r({
	create,
	extract,
	getContentProviders,
	fetch,
	installContentProvider,
	manageContentProvider,
	query,
	read,
	remove,
	update,
	runBatch
})
