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

import { useModel } from '../context'

import type { IToolOption } from '../types'

const Index = () => {
	const { tool_options, selected_tool_names, setTools } = useModel()
	const ref_anchor = useComboboxAnchor()
	const selected_items = tool_options.filter(item => selected_tool_names.includes(item.value))

	return (
		<div className='flex w-full flex-col p-6'>
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
					<ComboboxChipsInput placeholder='Search and select custom tools for agent' />
				</ComboboxChips>
				<ComboboxContent anchor={ref_anchor}>
					<ComboboxEmpty>No tools found.</ComboboxEmpty>
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
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
