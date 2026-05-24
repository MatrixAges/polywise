import {
	BookOpenText,
	Brain,
	Database,
	GitBranch,
	HardDriveUpload,
	Info,
	MessageSquareText,
	Sparkles,
	UserRound,
	Wrench
} from 'lucide-react'
import { observer } from 'mobx-react-lite'

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
	const { export_agent_loading, selected_agent_id, setCurrentTab, exportSelectedAgent } = useModel()

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
					flex flex-col
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
			<div className='shrink-0 pt-3'>
				<button
					className='click_button'
					type='button'
					disabled={!selected_agent_id || export_agent_loading}
					onClick={() => void exportSelectedAgent()}
				>
					<HardDriveUpload className='size-3.5'></HardDriveUpload>
					<span>{export_agent_loading ? 'Exporting...' : 'Export Agent'}</span>
				</button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
