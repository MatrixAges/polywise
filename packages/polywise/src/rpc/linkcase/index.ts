import { r } from '@core/utils'

import create from './create'
import fetch from './fetch'
import getContentProviders from './getContentProviders'
import installContentProvider from './installContentProvider'
import manageContentProvider from './manageContentProvider'
import query from './query'
import read from './read'
import remove from './remove'

export default r({
	create,
	getContentProviders,
	fetch,
	installContentProvider,
	manageContentProvider,
	query,
	read,
	remove
})
