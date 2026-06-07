import { useEffect, useMemo, useState } from 'react'
import { useToggle } from 'ahooks'
import { MessageCircleQuestionMark } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import type { IPropsQuestion } from '../types'

const Index = (props: IPropsQuestion) => {
	const { streaming, input, output, answer } = props
	const { question, options, multiple } = input
	const { t } = useTranslation('components')

	const [selected, setSelected] = useState<Array<string>>([])
	const [custom_value, setCustomValue] = useState('')
	const [open, { toggle, set }] = useToggle(true)

	const disabled = useMemo(() => output !== undefined, [output])

	useEffect(() => set(streaming), [streaming])

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
				group
				data-[open=true]:rounded-md data-[open=true]:bg-secondary
			'
			data-open={open}
		>
			<div
				className='
					text-std-400 text-sm
					group-data-[open=false]:line-clamp-1 group-data-[open=true]:px-3 group-data-[open=true]:pt-2 group/header
					cursor-pointer select-none
				'
				onClick={toggle}
			>
				<MessageCircleQuestionMark className='text-std-400 mr-2 inline-block size-3'></MessageCircleQuestionMark>
				<span className='text-muted-foreground group-hover/header:text-foreground mr-2'>
					{t('session.question.label')}
				</span>
				<span
					className='
						wrap-break-word
						text-std-400 text-xs
						capitalize
					'
				>
					{question}
					{multiple ? ` (${t('session.question.multiple')})` : ''}
				</span>
			</div>
			{open && (
				<div
					className='
						flex flex-col
						gap-3
						p-3 pt-0
					'
				>
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
										<span className='text-std-500 text-xs'>
											{option.description}
										</span>
									)}
								</div>
							)
						})}
					</div>
					{(!disabled || (disabled && typeof value === 'string')) && (
						<Input
							className='bg-card border-none text-sm focus-visible:ring-0'
							placeholder={t('session.question.placeholder')}
							disabled={disabled}
							value={custom_value}
							onChange={e => setCustomValue(e.target.value)}
						/>
					)}
					{streaming && !disabled && (
						<Button
							className='self-end'
							size='sm'
							disabled={!custom_value && selected.length === 0}
							onClick={handleSubmit}
						>
							{t('session.question.submit')}
						</Button>
					)}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
