import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { fromNow } from '@/utils'

import { useModel } from '../context'

import type { Todo } from '@core/db'

interface IProps {
	item: Todo
	index: number
	selected: boolean
}

const Index = (props: IProps) => {
	const { item, index, selected } = props
	const { title, created_at } = item
	const { setSelectTodo } = useModel()

	const onClick = useMemoizedFn(() => setSelectTodo(item.status, index))

	return (
		<div
			className={$cx(
				`
				flex flex-col
				w-full
				gap-1
				px-3 py-2
				rounded-lg
				border border-border-light
				transition-colors
				cursor-pointer
			`,
				selected && 'bg-secondary/60 border-primary/40'
			)}
			onClick={onClick}
		>
			<span
				className='
					w-full
					font-medium leading-5.5!
					text-left
					outline-none
				'
			>
				{title}
			</span>
			<span className='text-std-400 mt-0.5 text-sm'>{fromNow(created_at)}</span>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
