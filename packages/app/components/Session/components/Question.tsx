import { useState } from 'react'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import type { IPropsQuestion } from '../types'

const Index = (props: IPropsQuestion) => {
	const { input, output, answer } = props
	const { question, options, multiple, custom } = input

	const [selected, setSelected] = useState<Array<string>>([])
	const [custom_value, setCustomValue] = useState('')

	const toggleOption = (label: string) => {
		if (multiple) {
			setSelected(prev => (prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]))
		} else {
			setSelected([label])
		}
	}

	const handleSubmit = () => {
		if (custom_value) {
			answer(custom_value)
		} else if (selected.length > 0) {
			answer(selected.join(', '))
		}
	}

	return (
		<div
			className='
				flex flex-col
				gap-3
				p-3
				mb-1
				rounded-lg
				bg-secondary
			'
		>
			<span className='text-sm font-medium'>{question}</span>
			<div className='flex flex-col gap-2'>
				{options.map((option, index) => {
					const is_selected = selected.includes(option.label)

					return (
						<button
							type='button'
							className={`
							flex flex-col
							gap-0.5
							p-3
							rounded-md
							text-left
							border
							transition-colors
							${is_selected ? 'border-primary bg-primary/5' : 'border-border-light hover:border-border-dark'}
							`}
							onClick={() => toggleOption(option.label)}
							key={index}
						>
							<span className='text-sm font-medium'>{option.label}</span>
							{option.description && (
								<span className='text-std-500 text-xs'>{option.description}</span>
							)}
						</button>
					)
				})}
			</div>
			{custom && (
				<Input
					placeholder='Type your answer...'
					value={custom_value}
					onChange={e => setCustomValue(e.target.value)}
					className='text-sm'
				/>
			)}
			<Button
				size='sm'
				disabled={!custom_value && selected.length === 0}
				onClick={handleSubmit}
				className='self-end'
			>
				Submit
			</Button>
		</div>
	)
}

export default $app.memo(Index)
