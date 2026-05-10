import { useEffect, useRef } from 'react'

import { Input } from '@/__shadcn__/components/ui/input'

interface IProps {
	active: boolean
	value: string
	set_rename_value: (value: string) => void
	submit_rename: () => void
	cancel_rename: () => void
}

const Index = (props: IProps) => {
	const { active, value, set_rename_value, submit_rename, cancel_rename } = props
	const ref_input = useRef<HTMLInputElement>(null)
	const ref_is_composing = useRef(false)

	useEffect(() => {
		if (active) {
			ref_input.current?.focus()
			ref_input.current?.select()
		}
	}, [active])

	if (!active) return null

	return (
		<Input
			className='
				h-auto
				p-0
				rounded-none
				bg-transparent
				border-none outline-none
				ring-0!
			'
			value={value}
			onChange={event => set_rename_value(event.target.value)}
			onCompositionStart={() => {
				ref_is_composing.current = true
			}}
			onCompositionEnd={() => {
				ref_is_composing.current = false
			}}
			onBlur={() => {
				if (ref_is_composing.current) return

				submit_rename()
			}}
			onKeyDown={event => {
				if (event.nativeEvent.isComposing || ref_is_composing.current || event.keyCode === 229) {
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					submit_rename()
				}

				if (event.key === 'Escape') {
					event.preventDefault()
					cancel_rename()
				}
			}}
			ref={ref_input}
		></Input>
	)
}

export default $app.memo(Index)
