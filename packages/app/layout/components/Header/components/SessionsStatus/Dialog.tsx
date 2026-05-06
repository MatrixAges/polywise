import { ArrowLeft, CircleAlert, Grip, Loader, MessageSquareDot } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Dialog, Session, Tabs } from '@/components'

import type Model from './model'

interface IProps {
	x: Model
}

const tab_items = [
	{ key: 'unread', Icon: MessageSquareDot },
	{ key: 'running', Icon: Loader },
	{ key: 'error', Icon: CircleAlert }
]

const Index = (props: IProps) => {
	const { x } = props
	const current_list = x.list

	return (
		<Dialog
			open={x.open}
			title='Active Sessions'
			desc='A panel for quickly viewing dynamic session changes'
			className='w-[800px] max-w-none! gap-4'
			max_height='h-[80vh]'
			setOpen={x.toggleOpen}
		>
			<div
				className='
					overflow-hidden
					flex
					w-full h-full
				'
			>
				<div
					className='
						flex flex-col
						w-[210px] h-full
					'
				>
					<Tabs items={tab_items} active={x.current_status} onClick={x.setCurrentStatus}></Tabs>
					<div
						className='
							overflow-y-auto
							flex flex-1 flex-col
							min-h-0
							py-2
						'
					>
						{current_list.length ? (
							current_list.map(item => {
								const Status = item.is_runing ? (
									<Grip className='text-std-400! size-3' />
								) : item.unread ? (
									<ArrowLeft className='text-std-300! size-3' />
								) : (
									<CircleAlert className='size-3 text-red-400!' />
								)

								return (
									<div
										className={$cx(
											`
										items-center
										gap-2
										rounded-sm
										click_button
									`,
											x.selected_session_id === item.id && 'active'
										)}
										onClick={() => x.setSelectedSession(item.id)}
										key={item.id}
									>
										<div className='min-w-0 flex-1'>
											<div className='truncate text-sm font-medium'>
												{item.title}
											</div>
											<div className='text-std-400 truncate text-xs'>
												{item.report || item.title}
											</div>
										</div>
										{Status}
									</div>
								)
							})
						) : (
							<div
								className='
									flex
									items-center justify-center
									h-full
									text-sm text-std-300
								'
							>
								No sessions
							</div>
						)}
					</div>
				</div>
				<div className='flex min-w-0 flex-1'>
					{x.selected_session_id ? (
						<Session type='dialog' id={x.selected_session_id}></Session>
					) : (
						<div
							className='
								flex
								items-center justify-center
								w-full h-full
								text-sm text-std-300
							'
						>
							No session selected
						</div>
					)}
				</div>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
