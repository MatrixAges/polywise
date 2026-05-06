import { useEffect, useRef } from 'react'

import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import type { RefObject } from 'react'

interface IProps {
	active: boolean
	value: string
	multiline?: boolean
	placeholder?: string
	onSubmit: (value: string) => void
	onCancel: () => void
}

const Index = (props: IProps) => {
	const { active, value, multiline, placeholder, onSubmit, onCancel } = props
	const ref_input = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
	const ref_is_composing = useRef(false)

	useEffect(() => {
		if (active) {
			ref_input.current?.focus()
			ref_input.current?.select?.()
		}
	}, [active])

	if (!active) return null

	if (multiline) {
		return (
			<Textarea
				className='min-h-24 rounded-lg'
				defaultValue={value}
				placeholder={placeholder}
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
			className='bg-secondary/40 rounded-lg'
			defaultValue={value}
			placeholder={placeholder}
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
