import { EventEmitter, on } from 'events'
import { main_emitter, p } from '@desktop/utils'

type Res = { type: 'blur'; value: boolean } | { type: 'maximize'; value: boolean }

export default p.subscription(async function* (args) {
	const { ctx, signal } = args

	const e = new EventEmitter()

	const onMainChange = (data: Res) => e.emit('CHANGE', data)
	const onFocus = () => e.emit('CHANGE', { type: 'blur', value: false })
	const onBlur = () => e.emit('CHANGE', { type: 'blur', value: true })
	const onMaximize = () => e.emit('CHANGE', { type: 'maximize', value: ctx.win.isMaximized() })

	try {
		main_emitter.on('CHANGE', onMainChange)
		ctx.win.on('focus', onFocus)
		ctx.win.on('blur', onBlur)
		ctx.win.on('maximize', onMaximize)
		ctx.win.on('unmaximize', onMaximize)

		yield { type: 'maximize', value: ctx.win.isMaximized() } satisfies Res

		for await (const [data] of on(e, 'CHANGE', { signal })) {
			yield data as Res
		}
	} finally {
		main_emitter.off('CHANGE', onMainChange)
		ctx.win.off('focus', onFocus)
		ctx.win.off('blur', onBlur)
		ctx.win.off('maximize', onMaximize)
		ctx.win.off('unmaximize', onMaximize)

		e.removeAllListeners()
	}
})
