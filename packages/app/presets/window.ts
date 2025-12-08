import cx from 'classix'
import Emittery from 'stk/emittery'
import { copy } from 'stk/mobx'
import { handle, memo } from 'stk/react'

import type { MessageInstance } from 'antd/es/message/interface'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import type { NotificationInstance } from 'antd/es/notification/interface'

window.$is_dev = process.env.NODE_ENV === 'development'
window.$is_prod = process.env.NODE_ENV === 'production'

window.$app = {
	// @ts-ignore
	memo,
	handle,
	Event: new Emittery()
}

window.$t = (() => {}) as any
window.$copy = copy
// @ts-ignore
window.$cx = cx

window.$message = {} as MessageInstance
window.$notification = {} as NotificationInstance
window.$modal = {} as Omit<ModalStaticFunctions, 'warn'>
