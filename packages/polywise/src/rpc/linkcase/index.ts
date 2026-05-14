import { r } from '@core/utils'

import create from './create'
import fetch from './fetch'
import query from './query'
import remove from './remove'

export default r({
	create,
	fetch,
	query,
	remove
})
