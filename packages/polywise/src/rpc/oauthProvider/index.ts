import { r } from '@core/utils'

import connect from './connect'
import getAll from './getAll'
import sync from './sync'

export default r({
	getAll,
	connect,
	sync
})
