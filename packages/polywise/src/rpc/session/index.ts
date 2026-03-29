import { r } from '@core/utils'

import { clear, destroy, stop } from './events'
import init from './init'

export default r({
	init,
	stop,
	clear,
	destroy
})
