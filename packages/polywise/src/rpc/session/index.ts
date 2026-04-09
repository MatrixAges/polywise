import { r } from '@core/utils'

import { answer, archive, clear, destroy, load, permission, stop } from './events'
import init from './init'

export default r({
	init,
	stop,
	clear,
	archive,
	load,
	answer,
	permission,
	destroy
})
