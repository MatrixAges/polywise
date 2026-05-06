import { r } from '@core/utils'

import create from './create'
import createEntry from './createEntry'
import moveEntries from './moveEntries'
import query from './query'
import remove from './remove'
import removeEntry from './removeEntry'
import saveFile from './saveFile'
import sort from './sort'
import update from './update'

export default r({
	createEntry,
	create,
	moveEntries,
	query,
	remove,
	removeEntry,
	saveFile,
	sort,
	update
})
