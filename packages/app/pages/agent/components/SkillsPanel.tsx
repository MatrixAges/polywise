import { useState } from 'react'
import { Logs, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor
} from '@/__shadcn__/components/ui/combobox'
import { Separator } from '@/__shadcn__/components/ui/separator'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Tabs } from '@/components'

import { useModel } from '../context'
import CallLogPanel from './CallLogPanel'

import type { ISkillOption } from '../types'

const Index = () => {
	const { t } = useTranslation('agent')
	const [active_tab, setActiveTab] = useState<'skills' | 'logs'>('skills')
	const {
		can_edit_selected_agent_behavior,
		skill_options,
		selected_skill_bindings,
		selected_skill_ids,
		setSkills,
		setSkillEnabled,
		skill_log_available_dates,
		skill_log_date,
		skill_log_has_more,
		skill_log_items,
		skill_log_loading,
		skill_log_page,
		skill_log_total,
		setSkillLogDate,
		setSkillLogPage
	} = useModel()
	const ref_anchor = useComboboxAnchor()
	const selected_items = skill_options.filter(item => selected_skill_ids.includes(item.value))
	const selected_binding_map = new Map(selected_skill_bindings.map(item => [item.id, item.enabled]))
	const tab_items = [
		{ key: 'skills', title: t('skills.tab_skills'), Icon: Sparkles },
		{ key: 'logs', title: t('skills.tab_logs'), Icon: Logs }
	] as const

	return (
		<div
			className='
				flex flex-col
				w-full h-full
				min-h-0
			'
		>
			<div
				className='
					shrink-0
					h-9
					mt-[-13.5]
				'
			>
				<Tabs
					small
					items={tab_items}
					active={active_tab}
					onClick={value => setActiveTab(value as 'skills' | 'logs')}
				/>
				<Separator className='mt-3' />
			</div>
			<div
				className='
					overflow-y-auto
					flex-1
					min-h-0
				'
			>
				{active_tab === 'skills' ? (
					<div className='flex flex-col gap-3 pb-6'>
						<div
							className={$cx(
								!can_edit_selected_agent_behavior && 'pointer-events-none opacity-50'
							)}
						>
							<Combobox<ISkillOption, true>
								multiple
								items={skill_options}
								value={selected_items}
								onValueChange={value => setSkills(value.map(item => item.value))}
								isItemEqualToValue={(item_value, value) =>
									item_value.value === value.value
								}
							>
								<ComboboxChips
									className='
										w-full
										bg-transparent!
										focus-within:ring-0
									'
									ref={ref_anchor}
								>
									{selected_items.map(item => (
										<ComboboxChip key={item.value}>{item.label}</ComboboxChip>
									))}
									<ComboboxChipsInput placeholder={t('skills.placeholder')} />
								</ComboboxChips>
								<ComboboxContent anchor={ref_anchor}>
									<ComboboxEmpty>{t('skills.empty')}</ComboboxEmpty>
									<ComboboxList>
										{(item: ISkillOption) => (
											<ComboboxItem value={item} key={item.value}>
												<div className='flex min-w-0 flex-col'>
													<span>{item.label}</span>
													<span className='text-std-400 truncate text-xs'>
														{item.description || item.path}
													</span>
												</div>
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</div>
						{selected_items.length > 0 && (
							<div className='flex flex-col gap-2'>
								{selected_items.map(item => {
									const enabled = selected_binding_map.get(item.value) ?? true

									return (
										<div
											key={item.value}
											className='
											flex
											items-center justify-between
											gap-3
											px-3 py-2
											rounded-xl
											border border-border-light
										'
										>
											<div className='min-w-0 flex-1'>
												<div className='truncate text-sm font-medium'>
													{item.label}
												</div>
												<div className='text-std-400 truncate text-xs'>
													{item.description || item.path}
												</div>
											</div>
											<div className='flex items-center gap-2'>
												<span className='text-std-400 text-xs'>
													{enabled
														? t('skills.enabled')
														: t('skills.disabled')}
												</span>
												<Switch
													size='sm'
													checked={enabled}
													onCheckedChange={next_value =>
														void setSkillEnabled({
															skill_id: item.value,
															enabled: Boolean(next_value)
														})
													}
												/>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				) : (
					<div className='flex flex-col pb-6'>
						<CallLogPanel
							available_dates={skill_log_available_dates}
							date={skill_log_date}
							empty_text={t('skills.log_empty')}
							has_more={skill_log_has_more}
							items={skill_log_items}
							loading={skill_log_loading}
							onDateChange={setSkillLogDate}
							onPageChange={setSkillLogPage}
							page={skill_log_page}
							renderSummary={item =>
								`${item.action}${item.skill_name ? ` · ${item.skill_name}` : ''}`
							}
							total={skill_log_total}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
