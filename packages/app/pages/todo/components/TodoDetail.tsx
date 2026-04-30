import { useMemoizedFn } from 'ahooks'
import { X } from 'lucide-react'

import { useModel } from '../context'
import TodoDetailDescription from './TodoDetailDescription'
import TodoDetailFields from './TodoDetailFields'

const Index = () => {
	const { selected_todo, closeDetailPanel } = useModel()

	if (!selected_todo) return null

	const onClose = useMemoizedFn(() => {
		closeDetailPanel()
	})

	return (
		<div
			className='
				flex flex-col
				w-[320px] h-full
				bg-std-50
				border-l border-border-light
			'
		>
			<div
				className='
					flex
					items-center justify-between
					px-3 py-2
					border-b border-border-light
				'
			>
				<span className='text-std-700 text-sm font-medium'>Task Details</span>
				<div className='icon_button' onClick={onClose}>
					<X size={14} />
				</div>
			</div>
			<div className='flex-1 overflow-y-auto p-3'>
				<div className='flex flex-col gap-4'>
					<div className='text-std-800 text-base font-medium'>{selected_todo.title}</div>
					<TodoDetailFields todo={selected_todo} />
					<TodoDetailDescription todo={selected_todo} />
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)
