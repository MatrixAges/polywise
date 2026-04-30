import { useMemoizedFn } from 'ahooks'
import { CheckCircle, FolderKanban } from 'lucide-react'

import { useModel } from '../context'

import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { type, project, selected } = props
	const { setFilter, setSelectedProject } = useModel()

	const onClick = useMemoizedFn(() => {
		if (type === 'all') {
			setFilter('all')
		} else if (project) {
			setSelectedProject(project.id)
		}
	})

	return (
		<div className={$cx('click_button gap-2 px-2 py-1', selected && 'active')} onClick={onClick}>
			{type === 'all' ? (
				<>
					<CheckCircle size={14}></CheckCircle>
					<span>All</span>
				</>
			) : (
				<>
					<FolderKanban size={14}></FolderKanban>
					<span className='truncate'>{project?.name}</span>
				</>
			)}
		</div>
	)
}

export default $app.memo(Index)
