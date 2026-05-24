import cx from 'classix'
import rfdc from 'rfdc'

import Handle from './Handle'
import memo from './memo'

export const $ = {
	cx,
	memo,
	copy: rfdc({ proto: true }),
	Handle
}
