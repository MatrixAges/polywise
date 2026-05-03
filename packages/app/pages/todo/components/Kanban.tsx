import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import Col from './Col'

import type { Todo } from '@core/db'

const Index = () => {
	const { kanban_data } = useModel()

	return (
		<div
			className='
				overflow-x-scroll overflow-y-hidden
				flex flex-1
				min-w-0
				gap-5
				px-5 py-1
			'
		>
			{Object.keys(kanban_data).map(key => (
				<Col status={key} todos={kanban_data[key] as Array<Todo>} key={key}></Col>
			))}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
