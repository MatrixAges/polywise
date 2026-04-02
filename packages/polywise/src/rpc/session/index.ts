import { r } from '@core/utils'

import { answer, clear, destroy, load, permission, stop } from './events'
import init from './init'

export default r({
	init,
	stop,
	clear,
	load,
	answer,
	permission,
	destroy
})
