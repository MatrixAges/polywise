import { r } from '@core/utils'

import create from './create'
import query from './query'
import remove from './remove'
import sort from './sort'
import update from './update'

export default r({
	create,
	query,
	remove,
	sort,
	update
})
