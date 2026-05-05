import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { ArrowLeft, CircleAlert, Grip } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Dialog, Session, Tabs } from '@/components'
import { rpc } from '@/utils'

import type Model from './model'

interface IProps {
	x: Model
}

const tab_items = [
	{ key: 'running', title: 'running' },
	{ key: 'unread', title: 'unread' },
	{ key: 'error', title: 'error' }
]

const Index = (props: IProps) => {
	const { x } = props
	const current_list = x.data[x.active_status]

	const setOpen = useMemoizedFn((open: boolean) => x.setOpen(open))
	const onClickTab = useMemoizedFn((key: string) => x.setActiveStatus(key as keyof Model['data']))

	useEffect(() => {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: async res => x.updateByStatus(res)
		})

		return () => {
			deinit.unsubscribe()
		}
	}, [x])

	return (
		<Dialog
			open={x.open}
			title='Sessions Status'
			className='w-[1120px] max-w-[min(1120px,calc(100vw-40px))]'
			max_height='max-h-[72vh]'
			setOpen={setOpen}
		>
			<div
				className='
					overflow-hidden
					flex
					w-full h-[72vh]
					min-h-[560px]
				'
			>
				<div
					className='
						flex flex-col
						w-[280px]
						border-r border-border-light
					'
				>
					<div className='border-border-light border-b px-3 py-2'>
						<Tabs items={tab_items} active={x.active_status} onClick={onClickTab}></Tabs>
					</div>
					<div
						className='
							overflow-y-auto
							flex flex-1 flex-col
							min-h-0
							p-2
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
						<Session type='page' id={x.selected_session_id}></Session>
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
