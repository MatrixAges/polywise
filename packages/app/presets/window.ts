import cx from 'classix'
import Emittery from 'stk/emittery'
import { copy } from 'stk/mobx'
import { handle, memo } from 'stk/react'

window.$is_dev = process.env.NODE_ENV === 'development'
window.$is_prod = process.env.NODE_ENV === 'production'

window.$app = {
	memo,
	handle,
	Event: new Emittery()
}

window.$t = (() => {}) as any
window.$copy = copy
window.$cx = cx
