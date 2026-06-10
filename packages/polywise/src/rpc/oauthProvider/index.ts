import { r } from '@core/utils'

import connect from './connect'
import getAll from './getAll'
import resetModels from './resetModels'
import setEnabled from './setEnabled'
import setModels from './setModels'
import sync from './sync'

export default r({
	getAll,
	connect,
	sync,
	setEnabled,
	setModels,
	resetModels
})
