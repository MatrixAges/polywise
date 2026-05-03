import { FolderKanban, Inbox, ListPlus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Tooltip } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { projects } = useModel()

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
					items-center justify-between
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
				<div className='mr-[-2px] flex gap-1'>
					<Tooltip title='New Todo'>
						<div className='icon_button small'>
							<ListPlus></ListPlus>
						</div>
					</Tooltip>
				</div>
			</div>
			<div className='flex min-h-0 flex-col overflow-y-scroll'>
				<div
					className='
						flex flex-col
						w-full
						gap-1
						p-1.5
						pb-3
					'
				>
					<div className='click_button justify-between'>
						<div className='flex items-center gap-2'>
							<Inbox></Inbox>
							<span>Inbox</span>
						</div>
						<span
							className='
								px-1 py-0.5
								rounded-full
								text-xs leading-none
								bg-secondary
								border border-border-light
							'
						>
							6
						</span>
					</div>
					{projects.map(item => (
						<div className='click_button justify-between'>
							<div className='flex items-center gap-2'>
								<FolderKanban></FolderKanban>
								<span className='capitalize'>{item.name}</span>
							</div>
							<span
								className='
									px-1 py-0.5
									rounded-full
									text-xs leading-none
									bg-secondary
									border border-border-light
								'
							>
								6
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
