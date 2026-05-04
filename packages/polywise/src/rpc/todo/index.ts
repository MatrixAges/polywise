import { r } from '@core/utils'

import create from './create'
import drag from './drag'
import getArchives from './getArchives'
import getMenuData from './getMenuData'
import getMoreArchives from './getMoreArchives'
import query from './query'
import remove from './remove'
import sort from './sort'
import update from './update'

export default r({
	create,
	drag,
	getArchives,
	getMenuData,
	getMoreArchives,
	query,
	remove,
	sort,
	update
})
