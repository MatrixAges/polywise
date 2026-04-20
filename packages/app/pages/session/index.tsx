import { useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Session } from '@/components'

import { Menu } from './components'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.init()

		return () => x.deinit()
	}, [])

	return (
		<div>
			<Menu
				groups={$copy(x.groups)}
				sessions={$copy(x.sessions)}
				selected_session_id={x.selected_session_id}
				setSelectedSession={x.setSelectedSession}
				loadMore={x.loadMore}
			></Menu>
			{x.selected_session_id ? <Session id={x.selected_session_id}></Session> : <div></div>}
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
