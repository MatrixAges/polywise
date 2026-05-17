import { CheckCircle, PencilLine, Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'

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
					placeholder='Search links'
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
							text-xsm text-std-400
							bg-layout-over
						'
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent align='end'>
						<SelectGroup>
							<SelectLabel>Filter</SelectLabel>
							<SelectItem value='title'>title</SelectItem>
							<SelectItem value='link'>link</SelectItem>
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
