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
import { useTranslation } from 'react-i18next'

import { Switch } from '@/__shadcn__/components/ui/switch'
import { alert } from '@/utils'

import { useModel } from '../context'

import type { AgentTab } from '../types'

const tabs = [
	{ key: 'info', Icon: Info },
	{ key: 'prompt', Icon: MessageSquareText },
	{ key: 'soul', Icon: Brain },
	{ key: 'identity', Icon: UserRound },
	{ key: 'memory', Icon: Database },
	{ key: 'skills', Icon: Sparkles },
	{ key: 'tools', Icon: Wrench },
	{ key: 'content', Icon: BookOpenText },
	{ key: 'graph', Icon: GitBranch }
] as const

interface IProps {
	active_tab: Exclude<AgentTab, 'sessions'>
}

const Index = ({ active_tab }: IProps) => {
	const { t } = useTranslation('agent')
	const {
		export_agent_loading,
		selected_agent,
		selected_agent_id,
		setCurrentTab,
		exportSelectedAgent,
		removeAgent,
		toggleAgentFrozen
	} = useModel()

	const onRemove = async () => {
		if (!selected_agent_id) {
			return
		}

		const confirmed = await alert({
			title: t('detail.remove_title'),
			desc: t('detail.remove_desc')
		})

		if (!confirmed) {
			return
		}

		await removeAgent(selected_agent_id)
	}

	const getTabTitle = (key: (typeof tabs)[number]['key']) => {
		switch (key) {
			case 'info':
				return t('detail.info')
			case 'prompt':
				return t('detail.prompt')
			case 'soul':
				return t('detail.soul')
			case 'identity':
				return t('detail.identity')
			case 'memory':
				return t('detail.memory')
			case 'skills':
				return t('detail.skills')
			case 'tools':
				return t('detail.tools')
			case 'content':
				return t('detail.content')
			case 'graph':
				return t('detail.graph')
		}
	}

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[120px] h-full
				min-h-0
				px-2 py-1.5
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
							<span>{getTabTitle(item.key)}</span>
						</button>
					)
				})}
			</div>
			<div
				className='
					flex flex-col shrink-0
					gap-2
					pt-2
				'
			>
				{selected_agent ? (
					<div
						className='
							flex
							items-center justify-between
							gap-2
							px-2 py-1.5
							rounded-full
							border border-border-light
						'
					>
						<div className='min-w-0'>
							<div className='text-xs font-medium'>{t('detail.frozen')}</div>
						</div>
						<Switch
							size='sm'
							checked={Boolean(selected_agent.is_frozen)}
							onCheckedChange={next_value => void toggleAgentFrozen(Boolean(next_value))}
						/>
					</div>
				) : null}
				<div className='flex items-center justify-between gap-2'>
					<button
						className='click_button small text-xs'
						type='button'
						disabled={!selected_agent_id || export_agent_loading}
						onClick={() => void exportSelectedAgent()}
					>
						<HardDriveUpload className='size-3'></HardDriveUpload>
						<span>{export_agent_loading ? t('detail.exporting') : t('detail.export')}</span>
					</button>
					<button
						className='icon_button small'
						type='button'
						disabled={!selected_agent_id || export_agent_loading}
						onClick={() => void onRemove()}
					>
						<Trash2 className='size-3'></Trash2>
					</button>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
