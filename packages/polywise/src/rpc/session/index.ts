import { r } from '@core/utils'

import { answer, clear, destroy, load, stop } from './events'
import init from './init'

export default r({
	init,
	stop,
	clear,
	load,
	answer,
	destroy
})
