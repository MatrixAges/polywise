import {
	BookOpenText,
	Brain,
	Database,
	GitBranch,
	HardDriveUpload,
	Info,
	MessageSquareText,
	Sparkles,
	Trash2,
	UserRound,
	Wrench
} from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { alert } from '@/utils'

import { useModel } from '../context'

import type { AgentTab } from '../types'

const tabs = [
	{ key: 'info', title: 'info', Icon: Info },
	{ key: 'prompt', title: 'prompt', Icon: MessageSquareText },
	{ key: 'soul', title: 'soul', Icon: Brain },
	{ key: 'identity', title: 'identity', Icon: UserRound },
	{ key: 'memory', title: 'memory', Icon: Database },
	{ key: 'skills', title: 'skills', Icon: Sparkles },
	{ key: 'tools', title: 'tools', Icon: Wrench },
	{ key: 'content', title: 'content', Icon: BookOpenText },
	{ key: 'graph', title: 'graph', Icon: GitBranch }
] as const

interface IProps {
	active_tab: Exclude<AgentTab, 'sessions'>
}

const Index = ({ active_tab }: IProps) => {
	const { export_agent_loading, selected_agent_id, setCurrentTab, exportSelectedAgent, removeAgent } = useModel()

	const onRemove = async () => {
		if (!selected_agent_id) {
			return
		}

		const confirmed = await alert({
			title: 'Remove Agent',
			desc: 'Confirm remove this agent?'
		})

		if (!confirmed) {
			return
		}

		await removeAgent(selected_agent_id)
	}

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[120px] h-full
				min-h-0
				p-2.5
			'
		>
			<div
				className='
					overflow-y-auto
					flex flex-col flex-1
					min-h-0
					gap-1
				'
			>
				{tabs.map(item => {
					const Icon = item.Icon

					return (
						<button
							className={$cx(
								'click_button capitalize',
								active_tab === item.key && 'active'
							)}
							type='button'
							key={item.key}
							onClick={() => setCurrentTab(item.key)}
						>
							<Icon className='size-3.5'></Icon>
							<span>{item.title}</span>
						</button>
					)
				})}
			</div>
			<div
				className='
					flex shrink-0
					items-center justify-between
					pt-3
				'
			>
				<button
					className='click_button small text-xs'
					type='button'
					disabled={!selected_agent_id || export_agent_loading}
					onClick={() => void exportSelectedAgent()}
				>
					<HardDriveUpload className='size-3'></HardDriveUpload>
					<span>{export_agent_loading ? 'Exporting...' : 'Export'}</span>
				</button>
				<button
					className='icon_button'
					type='button'
					disabled={!selected_agent_id || export_agent_loading}
					onClick={() => void onRemove()}
				>
					<Trash2 className='size-3'></Trash2>
				</button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
