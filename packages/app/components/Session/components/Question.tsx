import { useMemo, useState } from 'react'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import type { IPropsQuestion } from '../types'

const Index = (props: IPropsQuestion) => {
	const { input, output, answer } = props
	const { question, options, multiple } = input

	const [selected, setSelected] = useState<Array<string>>([])
	const [custom_value, setCustomValue] = useState('')

	const disabled = useMemo(() => output !== undefined, [output])

	const value = useMemo(() => {
		if (!output) return

		const target = options.filter(item => item.label === output).map(item => item.label)

		if (target.length > 0) {
			setSelected(target)

			return target
		}

		return output
	}, [options, output])

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
			<div className={$cx('flex flex-col gap-2', disabled && 'pointer-events-none')}>
				{options.map((option, index) => {
					const is_selected = selected.includes(option.label)

					return (
						<div
							className={$cx(
								`
							flex flex-col
							gap-0.5
							p-3
							rounded-md
							text-left
							bg-card
							border
							cursor-pointer
						`,
								is_selected
									? 'border-dark'
									: 'border-border-light hover:border-border-solid'
							)}
							onClick={() => toggleOption(option.label)}
							key={index}
						>
							<span className='text-sm font-medium'>{option.label}</span>
							{option.description && (
								<span className='text-std-500 text-xs'>{option.description}</span>
							)}
						</div>
					)
				})}
			</div>
			{(!disabled || (disabled && typeof value === 'string')) && (
				<Input
					className='bg-card text-sm'
					placeholder='Type your answer...'
					disabled={disabled}
					value={custom_value}
					onChange={e => setCustomValue(e.target.value)}
				/>
			)}
			{!disabled && (
				<Button
					className='self-end'
					size='sm'
					disabled={!custom_value && selected.length === 0}
					onClick={handleSubmit}
				>
					Submit
				</Button>
			)}
		</div>
	)
}

export default $app.memo(Index)
