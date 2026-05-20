import { r } from '@core/utils'

import create from './create'
import health from './health'
import query from './query'
import reload from './reload'
import remove from './remove'
import update from './update'

export default r({
	create,
	query,
	update,
	remove,
	health,
	reload
})
