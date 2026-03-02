import cx from 'clsx'
import Emittery from 'stk/emittery'
import { copy } from 'stk/mobx'
import { Handle, memo } from 'stk/react'

import { ShadowTracker } from '@/utils'

window.$is_dev = process.env.NODE_ENV === 'development'
window.$is_prod = process.env.NODE_ENV === 'production'

window.$t = (() => {}) as any

window.$app = {
	memo,
	Handle,
	Event: new Emittery()
}

window.$copy = copy
window.$cx = cx

customElements.define('shadow-tracker', ShadowTracker)
