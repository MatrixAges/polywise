import { EventEmitter, on } from 'events'

import { p } from '@desktop/utils'

type Res = { type: 'blur'; value: boolean } | { type: 'maximize'; value: boolean }

export default p.subscription(async function* (args) {
	const { ctx, signal } = args

	const e = new EventEmitter()

	const onFocus = () => e.emit('CHANGE', { type: 'blur', value: false })
	const onBlur = () => e.emit('CHANGE', { type: 'blur', value: true })
	const onMaximize = () => e.emit('CHANGE', { type: 'maximize', value: ctx.win.isMaximized() })

	try {
		ctx.win.on('focus', onFocus)
		ctx.win.on('blur', onBlur)
		ctx.win.on('maximize', onMaximize)
		ctx.win.on('unmaximize', onMaximize)

		for await (const [data] of on(e, 'CHANGE', { signal })) {
			yield data as Res
		}
	} finally {
		ctx.win.off('focus', onFocus)
		ctx.win.off('blur', onBlur)
		ctx.win.off('maximize', onMaximize)
		ctx.win.off('unmaximize', onMaximize)

		e.removeAllListeners()
	}
})
