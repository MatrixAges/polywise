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

import { useModel } from '../context'
import CallLogPanel from './CallLogPanel'

import type { IToolOption } from '../types'

const Index = () => {
	const { t } = useTranslation('agent')
	const {
		can_edit_selected_agent_behavior,
		tool_options,
		selected_tool_names,
		setTools,
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

	return (
		<div
			className='
				flex flex-col
				w-full
				min-h-0
				gap-3
			'
		>
			<div className={$cx(!can_edit_selected_agent_behavior && 'pointer-events-none opacity-50')}>
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
			<Separator />
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
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
