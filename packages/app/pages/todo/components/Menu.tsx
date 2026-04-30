import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import MenuItem from './MenuItem'

const Index = () => {
	const { selected_filter, selected_project_id, projects } = useModel()

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col
				w-[210px] h-full
				border-border-light border-r
			'
		>
			<div
				className='
					flex
					items-center
					h-8
					px-3
					border-b border-border-light
				'
			>
				<span
					className='
						px-1 py-0.5
						text-xsm text-std-500 font-medium
					'
				>
					Todos
				</span>
			</div>
			<div className='flex min-h-0 w-full flex-1'>
				<div
					className='
						overflow-y-scroll
						flex flex-col
						w-full
						gap-1
						px-1.5
						pb-3
					'
				>
					<MenuItem type='all' selected={selected_filter === 'all'}></MenuItem>
					{projects.map(project => (
						<MenuItem
							key={project.id}
							type='project'
							project={project}
							selected={selected_filter === 'project' && selected_project_id === project.id}
						></MenuItem>
					))}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
