import { useMemoizedFn } from 'ahooks'
import { Copy, Minus, Square, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'
import { ipc } from '@/utils'

const Index = () => {
	const global = useGlobal()
	const minimize = useMemoizedFn(() => ipc.app.actions.query({ type: 'minimize' }))
	const maximize = useMemoizedFn(() => ipc.app.actions.query({ type: 'maximize' }))
	const close = useMemoizedFn(() => ipc.app.actions.query({ type: 'close' }))

	return (
		<div
			className='
				absolute
				inset-y-0 right-0
				flex
				no_drag
			'
		>
			<button className='icon_button' onClick={minimize}>
				<Minus size={14}></Minus>
			</button>
			<button className='icon_button' onClick={maximize}>
				{global.setting.maximize ? <Copy size={12}></Copy> : <Square size={12}></Square>}
			</button>
			<button className='icon_button' onClick={close}>
				<X size={14}></X>
			</button>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
