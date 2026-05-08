import { useEffect, useRef, useState } from 'react'

import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import type { RefObject } from 'react'

interface IProps {
	active: boolean
	value: string
	multiline?: boolean
	placeholder?: string
	className?: string
	maxLength?: number
	onSubmit: (value: string) => void
	onCancel: () => void
}

const Index = (props: IProps) => {
	const { active, value, multiline, placeholder, className, maxLength, onSubmit, onCancel } = props
	const ref_input = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
	const ref_is_composing = useRef(false)
	const [draft_value, setDraftValue] = useState(value)

	useEffect(() => {
		if (active) {
			ref_input.current?.focus()
			ref_input.current?.select?.()
		}
	}, [active])

	useEffect(() => {
		if (active) {
			setDraftValue(value)
		}
	}, [active, value])

	if (!active) return null

	if (multiline) {
		return (
			<Textarea
				className={$cx(className)}
				value={draft_value}
				placeholder={placeholder}
				maxLength={maxLength}
				onChange={event => {
					setDraftValue(event.target.value)
				}}
				onCompositionStart={() => {
					ref_is_composing.current = true
				}}
				onCompositionEnd={() => {
					ref_is_composing.current = false
				}}
				onBlur={event => {
					if (ref_is_composing.current) return

					onSubmit(event.target.value)
				}}
				onKeyDown={event => {
					if (event.key === 'Escape') {
						event.preventDefault()
						onCancel()
					}
				}}
				ref={ref_input as RefObject<HTMLTextAreaElement>}
			></Textarea>
		)
	}

	return (
		<Input
			className={$cx(
				`
				h-auto
				min-h-auto
				p-0
				rounded-none
				leading-5.5
				bg-transparent!
			`,
				className
			)}
			value={draft_value}
			placeholder={placeholder}
			maxLength={maxLength}
			onChange={event => {
				setDraftValue(event.target.value)
			}}
			onCompositionStart={() => {
				ref_is_composing.current = true
			}}
			onCompositionEnd={() => {
				ref_is_composing.current = false
			}}
			onBlur={event => {
				if (ref_is_composing.current) return

				onSubmit(event.target.value)
			}}
			onKeyDown={event => {
				if (event.nativeEvent.isComposing || ref_is_composing.current || event.keyCode === 229) {
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					onSubmit(event.currentTarget.value)
				}

				if (event.key === 'Escape') {
					event.preventDefault()
					onCancel()
				}
			}}
			ref={ref_input as RefObject<HTMLInputElement>}
		></Input>
	)
}

export default $app.memo(Index)
