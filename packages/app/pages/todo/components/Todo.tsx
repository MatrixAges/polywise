import { observer } from 'mobx-react-lite'

import { fromNow } from '@/utils'

import { useModel } from '../context'

import type { Todo } from '@core/db'

interface IProps {
	item: Todo
	index: number
}

const Index = (props: IProps) => {
	const { item, index } = props
	const { title, created_at } = item

	const {} = useModel()

	return (
		<div
			className='
				flex flex-col
				w-full
				gap-1
				px-3 py-2
				rounded-lg
				border border-border-light
			'
		>
			<span className='font-medium'>{title}</span>
			<span className='text-std-400 text-sm'>{fromNow(created_at)}</span>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
