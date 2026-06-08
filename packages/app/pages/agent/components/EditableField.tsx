import { useEffect, useRef, useState } from 'react'

import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import type { RefObject } from 'react'

interface IProps {
	active: boolean
	value: string
	multiline?: boolean
	placeholder?: string
	class_name?: string
	auto_width?: boolean
	max_length?: number
	on_submit: (value: string) => void
	on_cancel: () => void
}

const Index = (props: IProps) => {
	const { active, value, multiline, placeholder, class_name, auto_width, max_length, on_submit, on_cancel } = props
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
				className={$cx(
					`
					h-auto
					min-h-auto
					p-0
					rounded-none
					leading-4.5
					bg-transparent!
					border-none
					ring-0!
				`,
					class_name
				)}
				value={draft_value}
				placeholder={placeholder}
				maxLength={max_length}
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

					on_submit(event.target.value)
				}}
				onKeyDown={event => {
					if (event.key === 'Escape') {
						event.preventDefault()
						on_cancel()
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
				auto_width && 'field-sizing-content w-auto! max-w-full min-w-[1ch]',
				class_name
			)}
			value={draft_value}
			placeholder={placeholder}
			maxLength={max_length}
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

				on_submit(event.target.value)
			}}
			onKeyDown={event => {
				if (event.nativeEvent.isComposing || ref_is_composing.current || event.keyCode === 229) {
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					on_submit(event.currentTarget.value)
				}

				if (event.key === 'Escape') {
					event.preventDefault()
					on_cancel()
				}
			}}
			ref={ref_input as RefObject<HTMLInputElement>}
		></Input>
	)
}

export default $app.memo(Index)
