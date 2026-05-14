import { PencilLine, Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
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
				gap-2
				p-3
				border-b border-border-light
			'
		>
			<div className='relative min-w-0 flex-1'>
				<Search
					className='
						absolute
						top-1/2
						left-3
						size-3.5
						text-std-300
						pointer-events-none -translate-y-1/2
					'
				/>
				<Input
					className='pl-8'
					value={x.search_keyword}
					placeholder='Search links'
					onChange={event => x.setSearchKeyword(event.target.value)}
				></Input>
			</div>
			<Select value={x.filter_type} onValueChange={value => value && x.setFilterType(value)}>
				<SelectTrigger
					className='
						w-[92px]
						px-3 py-2
						rounded-4xl
						text-sm
						bg-secondary/60
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
			{x.select_mode ? (
				<Button variant='ghost' size='xs' onClick={x.exitSelectMode}>
					Done
				</Button>
			) : (
				<Button variant='ghost' size='icon-xs' onClick={x.enterSelectMode}>
					<PencilLine className='size-3.5'></PencilLine>
				</Button>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
