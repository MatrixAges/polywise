import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Session } from '@/components'

import { AddModal, Menu } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<Context value={x}>
			<div className='flex h-full overflow-hidden'>
				<Menu></Menu>
				{x.selected_session_id && (
					<div className='h-full w-[calc(100%-210px)] flex-1'>
						<Session type='page' id={x.selected_session_id}></Session>
					</div>
				)}
			</div>
			<AddModal></AddModal>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
