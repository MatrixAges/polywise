import { Bot, Wrench } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { Separator } from '@/__shadcn__/components/ui/separator'
import { Switch } from '@/__shadcn__/components/ui/switch'

import { useModel } from '../context'
import SessionTargetIdentity from './SessionTargetIdentity'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')
	const disable_map = x.runtimeDisableMap
	const use_all_agents = x.form.runtime_agent_ids.length === 0

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-start gap-3'>
				<Wrench className='text-std-400 mt-0.5 size-4 shrink-0' />
				<div className='flex flex-col gap-1'>
					<div className='text-sm font-medium'>{t('im.runtime_options')}</div>
					<div className='text-std-500 text-sm'>{t('im.runtime_options_desc')}</div>
				</div>
			</div>

			<FieldGroup
				className='
					gap-0
					px-4 py-2
					rounded-2xl
					bg-background/70
					border
				'
			>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>{t('im.audit_mode')}</FieldTitle>
						<FieldDescription>{t('im.audit_mode_desc')}</FieldDescription>
					</FieldContent>
					<Select
						value={x.form.runtime_audit_mode}
						onValueChange={value =>
							x.updateForm('runtime_audit_mode', value as typeof x.form.runtime_audit_mode)
						}
					>
						<SelectTrigger className='w-[180px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='limited'>{t('im.audit_limited')}</SelectItem>
							<SelectItem value='auto'>{t('im.audit_auto')}</SelectItem>
							<SelectItem value='full'>{t('im.audit_full')}</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				<Separator className='bg-border/80 h-px w-full' />
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>{t('im.agent_tool')}</FieldTitle>
						<FieldDescription>{t('im.agent_tool_desc')}</FieldDescription>
					</FieldContent>
					<Switch
						checked={x.form.runtime_enable_agent_tool}
						onCheckedChange={value => x.updateForm('runtime_enable_agent_tool', value)}
					/>
				</Field>
			</FieldGroup>

			<div className='bg-background/70 rounded-2xl border p-4'>
				<div className='flex flex-col gap-1'>
					<div className='text-sm font-medium'>{t('im.sub_agents')}</div>
					<div className='text-std-500 text-sm'>{t('im.sub_agents_desc')}</div>
				</div>
				<div className='mt-4 grid gap-3 md:grid-cols-2'>
					{x.runtimeSubAgentItems.map(item => {
						const selected = x.form.runtime_sub_agent_keys.includes(item.key)

						return (
							<button
								type='button'
								key={item.key}
								onClick={() => x.toggleRuntimeSubAgent(item.key)}
								className={`
								flex flex-col
								items-start
								gap-1
								px-4 py-3
								rounded-2xl
								text-left
								border
								transition
								${selected ? 'border-foreground/15 bg-muted/70' : 'bg-muted/35 hover:bg-muted/55 border-transparent'}
								`}
							>
								<div className='text-sm font-medium'>{item.label}</div>
								<div className='text-std-500 text-sm'>{item.description}</div>
							</button>
						)
					})}
				</div>
				<div className='text-std-400 mt-3 text-xs'>
					{x.form.runtime_sub_agent_keys.length
						? t('im.sub_agents_enabled', {
								count: x.form.runtime_sub_agent_keys.length
							})
						: t('im.sub_agents_disabled')}
				</div>
			</div>

			<div className='bg-background/70 rounded-2xl border p-4'>
				<div
					className='
						flex flex-wrap
						items-start justify-between
						gap-3
					'
				>
					<div className='flex min-w-0 items-start gap-3'>
						<Bot className='text-std-400 mt-0.5 size-4 shrink-0' />
						<div className='flex flex-col gap-1'>
							<div className='text-sm font-medium'>{t('im.allowed_agents')}</div>
							<div className='text-std-500 text-sm'>{t('im.allowed_agents_desc')}</div>
						</div>
					</div>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() => x.updateForm('runtime_agent_ids', [])}
						disabled={use_all_agents}
					>
						{t('im.use_all_agents')}
					</Button>
				</div>

				<div className='mt-4 grid gap-3 md:grid-cols-2'>
					{!x.agents.length ? (
						<Badge variant='outline'>{t('im.no_agents_found')}</Badge>
					) : (
						x.agents.map(agent => {
							const selected = x.form.runtime_agent_ids.includes(agent.id)

							return (
								<Button
									type='button'
									variant={selected ? 'default' : 'outline'}
									className='h-auto justify-start px-3 py-3'
									key={agent.id}
									onClick={() => x.toggleRuntimeAgent(agent.id)}
								>
									<SessionTargetIdentity agent={agent} compact />
								</Button>
							)
						})
					)}
				</div>
				<div className='text-std-400 mt-3 text-xs'>
					{use_all_agents
						? t('im.current_scope_all')
						: t('im.current_scope_selected', { count: x.form.runtime_agent_ids.length })}
				</div>
			</div>

			<div className='bg-background/70 rounded-2xl border p-4'>
				<div className='flex flex-col gap-1'>
					<div className='text-sm font-medium'>{t('im.enabled_tools')}</div>
					<div className='text-std-500 text-sm'>{t('im.enabled_tools_desc')}</div>
				</div>
				<FieldGroup className='mt-4 gap-0'>
					{x.runtimeToolItems.map((item, index) => (
						<div key={item.key}>
							{index > 0 ? <Separator className='bg-border/80 h-px w-full' /> : null}
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>{item.label}</FieldTitle>
									<FieldDescription>{item.description}</FieldDescription>
								</FieldContent>
								<Switch
									checked={!disable_map.has(item.key)}
									onCheckedChange={value => x.toggleRuntimeTool(item.key, value)}
								/>
							</Field>
						</div>
					))}
				</FieldGroup>
			</div>
		</div>
	)
}

export default observer(Index)
