import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { CircleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import Model from './model'
import SessionDialog from './SessionDialog'

interface IProps {
	disconnected: boolean
}

const Index = (props: IProps) => {
	const { disconnected } = props
	const [x] = useState(() => container.resolve(Model))

	const onOpen = useMemoizedFn(() => x.setOpen(true))

	useEffect(() => {
		x.init()
	}, [x])

	return (
		<>
			<div className='icon_button w-auto! px-2' onClick={onOpen}>
				<span
					className={$cx(
						'h-1.5 w-1.5 rounded-full',
						disconnected ? 'bg-red-400' : 'bg-green-500/72'
					)}
				></span>
				<span>Status</span>
				<div
					className='
						flex
						items-center
						gap-1.5
						text-xs text-std-400
					'
				>
					{!!x.data.running.length && <span>{x.data.running.length}</span>}
					{!!x.data.unread.length && <span>{x.data.unread.length}</span>}
					{!!x.data.error.length && (
						<span className='flex items-center gap-1 text-red-400'>
							<CircleAlert className='size-3' />
							{x.data.error.length}
						</span>
					)}
				</div>
			</div>
			<SessionDialog x={x}></SessionDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
