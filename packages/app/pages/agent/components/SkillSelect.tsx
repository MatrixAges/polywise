import { observer } from 'mobx-react-lite'

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

import type { ISkillOption } from '../types'

const Index = () => {
	const {
		skill_options,
		selected_skill_ids,
		setSkills,
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

	return (
		<div className='flex min-h-0 w-full flex-col'>
			<div className='p-6 pb-4'>
				<Combobox<ISkillOption, true>
					multiple
					items={skill_options}
					value={selected_items}
					onValueChange={value => setSkills(value.map(item => item.value))}
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
						<ComboboxChipsInput placeholder='Search and select skills for agent' />
					</ComboboxChips>
					<ComboboxContent anchor={ref_anchor}>
						<ComboboxEmpty>No skills found.</ComboboxEmpty>
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
			<Separator />
			<div
				className='
					flex flex-1 flex-col
					min-h-0
					p-6 pt-4
				'
			>
				<CallLogPanel
					available_dates={skill_log_available_dates}
					date={skill_log_date}
					empty_text='No skill call logs for this date.'
					has_more={skill_log_has_more}
					items={skill_log_items}
					loading={skill_log_loading}
					onDateChange={setSkillLogDate}
					onPageChange={setSkillLogPage}
					page={skill_log_page}
					renderSummary={item => `${item.action}${item.skill_name ? ` · ${item.skill_name}` : ''}`}
					total={skill_log_total}
				/>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
