import { Bot, Clipboard, PanelRight, Search, SquareChartGantt } from 'lucide-react'
import { useState } from 'react'
import { Tabs } from 'antd'

import { memo } from '@/utils'

import { Chat, Query, Save, Task } from './components'

import type { IPropsPanel } from '../../types'

type Tab = 'chat' | 'save' | 'query' | 'task'

const Index = (props: IPropsPanel) => {
	const { onClose } = props
	const [active_tab, set_active_tab] = useState<Tab>('chat')

	return (
		<div className='flex h-full w-full flex-col'>
			<div className='border-std-900/8 is_drag flex h-[36px] items-center justify-between border-b border-l'>
				<div className='no_drag flex h-full'>
					<div
						className={$cx(
							'border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r',
							active_tab === 'chat' && 'bg-std-100 shadow-[0_1px_0_0_var(--color-std-100)]'
						)}
						onClick={() => set_active_tab('chat')}
					>
						<Bot size={18} />
					</div>
					<div
						className={$cx(
							'border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r',
							active_tab === 'save' && 'bg-std-100 shadow-[0_1px_0_0_var(--color-std-100)]'
						)}
						onClick={() => set_active_tab('save')}
					>
						<Clipboard size={16} />
					</div>
					<div
						className={$cx(
							'border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r',
							active_tab === 'query' && 'bg-std-100 shadow-[0_1px_0_0_var(--color-std-100)]'
						)}
						onClick={() => set_active_tab('query')}
					>
						<Search size={16} />
					</div>

					<div
						className={$cx(
							'border-std-900/8 clickable flex h-full w-[37px] items-center justify-center border-r',
							active_tab === 'task' && 'bg-std-100 shadow-[0_1px_0_0_var(--color-std-100)]'
						)}
						onClick={() => set_active_tab('task')}
					>
						<SquareChartGantt size={16} />
					</div>
				</div>
				<div
					className='no_drag clickable flex h-full w-[37px] items-center justify-center'
					onClick={onClose}
				>
					<PanelRight size={16} />
				</div>
			</div>
			<div className='bg-std-100 border-std-900/8 flex flex-1 overflow-hidden border-l'>
				<Tabs
					activeKey={active_tab}
					renderTabBar={() => null as any}
					className='h-full w-full [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full'
					items={[
						{ key: 'chat', label: 'Chat', children: <Chat /> },
						{ key: 'save', label: 'Save', children: <Save /> },
						{ key: 'query', label: 'Query', children: <Query /> },
						{ key: 'task', label: 'Task', children: <Task /> }
					]}
				/>
			</div>
		</div>
	)
}

export default memo(Index)
