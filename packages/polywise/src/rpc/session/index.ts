import { r } from '@core/utils'

import { destroy, stop } from './events'
import init from './init'

export default r({
	init,
	destroy,
	stop
})
