import { useState } from 'react'
import { Logs, Wrench } from 'lucide-react'
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

import type { IToolOption } from '../types'

const Index = () => {
	const { t } = useTranslation('agent')
	const [active_tab, setActiveTab] = useState<'tools' | 'logs'>('tools')
	const {
		can_edit_selected_agent_behavior,
		tool_options,
		selected_tool_bindings,
		selected_tool_names,
		setTools,
		setToolEnabled,
		tool_log_available_dates,
		tool_log_date,
		tool_log_has_more,
		tool_log_items,
		tool_log_loading,
		tool_log_page,
		tool_log_total,
		setToolLogDate,
		setToolLogPage
	} = useModel()
	const ref_anchor = useComboboxAnchor()
	const selected_items = tool_options.filter(item => selected_tool_names.includes(item.value))
	const selected_binding_map = new Map(selected_tool_bindings.map(item => [item.name, item.enabled]))
	const tab_items = [
		{ key: 'tools', title: t('tools.tab_tools'), Icon: Wrench },
		{ key: 'logs', title: t('tools.tab_logs'), Icon: Logs }
	] as const

	return (
		<div
			className='
				flex flex-col
				w-full
				min-h-0
				gap-3
			'
		>
			<Tabs
				items={tab_items}
				active={active_tab}
				onClick={value => setActiveTab(value as 'tools' | 'logs')}
			/>
			<Separator />
			{active_tab === 'tools' ? (
				<div className='flex flex-col gap-3'>
					<div
						className={$cx(
							!can_edit_selected_agent_behavior && 'pointer-events-none opacity-50'
						)}
					>
						<Combobox<IToolOption, true>
							multiple
							items={tool_options}
							value={selected_items}
							onValueChange={value => setTools(value.map(item => item.value))}
							isItemEqualToValue={(item_value, value) => item_value.value === value.value}
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
								<ComboboxChipsInput placeholder={t('tools.placeholder')} />
							</ComboboxChips>
							<ComboboxContent anchor={ref_anchor}>
								<ComboboxEmpty>{t('tools.empty')}</ComboboxEmpty>
								<ComboboxList>
									{(item: IToolOption) => (
										<ComboboxItem value={item} key={item.value}>
											<div className='flex min-w-0 flex-col'>
												<span>{item.label}</span>
												<span className='text-std-400 truncate text-xs'>
													{item.description}
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
												{item.description}
											</div>
										</div>
										<div className='flex items-center gap-2'>
											<span className='text-std-400 text-xs'>
												{enabled
													? t('tools.enabled')
													: t('tools.disabled')}
											</span>
											<Switch
												size='sm'
												checked={enabled}
												onCheckedChange={next_value =>
													void setToolEnabled({
														tool_name: item.value,
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
				<div className='flex flex-col'>
					<CallLogPanel
						available_dates={tool_log_available_dates}
						date={tool_log_date}
						empty_text={t('tools.log_empty')}
						has_more={tool_log_has_more}
						items={tool_log_items}
						loading={tool_log_loading}
						onDateChange={setToolLogDate}
						onPageChange={setToolLogPage}
						page={tool_log_page}
						renderSummary={item => item.tool_name}
						total={tool_log_total}
					/>
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
