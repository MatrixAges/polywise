import { r } from '@core/utils'

import cancel from './cancel'
import query from './query'
import retry from './retry'
import watch from './watch'

export default r({
	cancel,
	query,
	retry,
	watch
})
