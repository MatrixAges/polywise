import cx from 'clsx'
import Emittery from 'stk/emittery'
import { copy } from 'stk/mobx'
import { Handle, memo } from 'stk/react'

window.$is_dev = process.env.NODE_ENV === 'development'
window.$is_prod = process.env.NODE_ENV === 'production'

window.$app = {
	memo,
	Handle,
	Event: new Emittery()
}

window.$t = (() => {}) as any
window.$copy = copy
window.$cx = cx
