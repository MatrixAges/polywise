import { Bot, Boxes, Layers3 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'

import { useModel } from '../context'
import SessionTargetIdentity from './SessionTargetIdentity'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')
	const targetItems = [
		{ key: 'global', label: t('im.target_global'), Icon: Boxes },
		{ key: 'agent', label: t('im.target_agent'), Icon: Bot },
		{ key: 'group', label: t('im.target_group'), Icon: Layers3 }
	] as const

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-1'>
				<div className='text-sm font-medium'>{t('im.session_target')}</div>
				<div className='text-std-500 text-sm'>{t('im.session_target_desc')}</div>
			</div>

			<div className='flex flex-wrap gap-2'>
				{targetItems.map(item => {
					const Icon = item.Icon
					const active = x.form.session_target_type === item.key

					return (
						<Button
							type='button'
							size='sm'
							variant={active ? 'default' : 'outline'}
							className='h-auto px-3 py-2'
							key={item.key}
							onClick={() => x.setSessionTargetType(item.key)}
						>
							<Icon className='size-4' />
							<span>{item.label}</span>
						</Button>
					)
				})}
			</div>

			{x.form.session_target_type === 'global' ? (
				<div
					className='
						px-4 py-3
						rounded-2xl
						text-std-400 text-sm
						bg-muted/35
						border
					'
				>
					{t('im.target_global_desc')}
				</div>
			) : null}

			{x.form.session_target_type === 'agent' ? (
				<div className='bg-background/70 rounded-2xl border p-4'>
					<div className='mb-3 flex flex-col gap-1'>
						<div className='text-sm font-medium'>{t('im.owner_agent')}</div>
						<div className='text-std-500 text-sm'>{t('im.owner_agent_desc')}</div>
					</div>
					<Select
						value={x.form.session_target_agent_id}
						onValueChange={value => x.updateForm('session_target_agent_id', value ?? '')}
					>
						<SelectTrigger className='w-[180px]!'>
							<SelectValue placeholder={t('im.select_agent')} />
						</SelectTrigger>
						<SelectContent>
							{x.agents.map(agent => (
								<SelectItem value={agent.id} key={agent.id} className='py-3'>
									<SessionTargetIdentity agent={agent} compact />
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className='mt-3'>
						<SessionTargetIdentity agent={x.selectedTargetAgent} />
					</div>
				</div>
			) : null}

			{x.form.session_target_type === 'group' ? (
				<div className='bg-background/70 rounded-2xl border p-4'>
					<div className='mb-3 flex flex-col gap-1'>
						<div className='text-sm font-medium'>{t('im.group')}</div>
						<div className='text-std-500 text-sm'>{t('im.group_desc')}</div>
					</div>
					<Select
						value={x.form.session_target_group_id}
						onValueChange={value => x.updateForm('session_target_group_id', value ?? '')}
					>
						<SelectTrigger className='w-[240px]!'>
							<SelectValue placeholder={t('im.select_group')} />
						</SelectTrigger>
						<SelectContent>
							{x.groups.map(group => (
								<SelectItem value={group.id} key={group.id} className='py-3'>
									<SessionTargetIdentity group={group} compact />
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className='mt-3'>
						<SessionTargetIdentity group={x.selectedTargetGroup} />
					</div>
				</div>
			) : null}
		</div>
	)
}

export default observer(Index)
