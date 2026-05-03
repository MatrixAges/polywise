import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import Col from './Col'

import type { Todo } from '@core/db'

const Index = () => {
	const { mode, kanban_data } = useModel()

	return (
		<div
			className={$cx(
				'flex flex-1',
				mode === 'kanban'
					? `
				overflow-x-scroll overflow-y-hidden
				min-w-0
				gap-5
				px-5 py-1
			`
					: `min-h-0 flex-col overflow-y-scroll`
			)}
		>
			{Object.keys(kanban_data).map((key: string) => (
				<Col status={key} todos={kanban_data[key] as Array<Todo>} key={key}></Col>
			))}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
