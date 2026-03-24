import { r } from '@core/utils'

import download from './download'
import getStatus from './getStatus'
import progress from './progress'

export default r({
	getStatus,
	download,
	progress
})
