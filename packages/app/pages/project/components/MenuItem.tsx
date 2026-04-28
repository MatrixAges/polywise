import { Ellipsis, FolderIcon, MessageSquarePlus } from 'lucide-react'

import type { IPropsMenuItem } from '../types'

const Index = (props: IPropsMenuItem) => {
	const { item, index } = props
	const { project, sessions, has_more } = item

	return (
		<div
			className='
				flex
				items-center justify-between
				gap-2
				py-1
				pl-2.5 pr-1.5
				rounded-full
				text-std-400 text-sm font-medium
				hover:text-std-900 active:bg-click
				select-none
			'
		>
			<div className='flex items-center gap-1.5'>
				<FolderIcon size={12}></FolderIcon>
				<span className='capitalize'>{item.project.name}</span>
			</div>
			<div className='flex gap-1'>
				<button type='button' className='icon_button small'>
					<MessageSquarePlus></MessageSquarePlus>
				</button>
				<button type='button' className='icon_button small'>
					<Ellipsis></Ellipsis>
				</button>
			</div>
			<div className='flex flex-col'>
				{sessions.map((it, index) => (
					<div className='flex' data-project-index={index} data-session-index={index} key={it.id}>
						{it.title}
					</div>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)
