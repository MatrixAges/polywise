import cx from 'clsx'
import rfdc from 'rfdc'

import Handle from './Handle'
import memo from './memo'

export default {
	cx,
	memo,
	copy: rfdc({ proto: true }),
	Handle
}
