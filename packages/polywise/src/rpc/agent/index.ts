import { r } from '@core/utils'

import create from './create'
import query from './query'
import remove from './remove'
import update from './update'

export default r({
	create,
	remove,
	query,
	update
})
