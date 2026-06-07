import { CheckCircle, PencilLine, Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')
	const filter_items = [
		{ value: 'title', label: t('toolbar.title') },
		{ value: 'link', label: t('toolbar.link') }
	] as const
	const current_filter_label = filter_items.find(item => item.value === x.filter_type)?.label || x.filter_type

	return (
		<div
			className='
				flex
				items-center
				h-12
				gap-2
				px-1.5
				border-b border-border-light
			'
		>
			<div
				className='
					relative
					flex flex-1
					items-center
					min-w-0
				'
			>
				<Search
					className='
						absolute
						top-1/2
						left-1
						size-3.5
						text-std-300
						pointer-events-none -translate-y-1/2
					'
				/>
				<Input
					className='h-8 bg-transparent! pl-6'
					value={x.search_keyword}
					placeholder={t('toolbar.search_placeholder')}
					onChange={event => x.setSearchKeyword(event.target.value)}
				></Input>
				<Select value={x.filter_type} onValueChange={value => value && x.setFilterType(value)}>
					<SelectTrigger
						className='
							absolute
							right-0
							w-auto! h-8
							p-0! px-3 py-2
							rounded-4xl
							text-xs! text-std-300
							bg-layout-over
						'
						noStyle
					>
						<SelectValue>{current_filter_label}</SelectValue>
					</SelectTrigger>
					<SelectContent align='end'>
						<SelectGroup>
							<SelectLabel>{t('toolbar.filter')}</SelectLabel>
							{filter_items.map(item => (
								<SelectItem value={item.value} key={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			{x.select_mode ? (
				<div className='icon_button small' onClick={x.exitSelectMode}>
					<CheckCircle className='size-3'></CheckCircle>
				</div>
			) : (
				<div className='icon_button small' onClick={x.enterSelectMode}>
					<PencilLine className='size-3'></PencilLine>
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
