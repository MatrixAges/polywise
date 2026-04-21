import { useEffect, useRef } from 'react'

import { Input } from '@/__shadcn__/components/ui/input'

interface IProps {
	active: boolean
	value: string
	setRenameValue: (value: string) => void
	submitRename: () => void
	cancelRename: () => void
}

const Index = (props: IProps) => {
	const { active, value, setRenameValue, submitRename, cancelRename } = props
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
			className='h-8 rounded-lg px-2'
			value={value}
			onChange={event => setRenameValue(event.target.value)}
			onCompositionStart={() => {
				ref_is_composing.current = true
			}}
			onCompositionEnd={() => {
				ref_is_composing.current = false
			}}
			onBlur={() => {
				if (ref_is_composing.current) return

				submitRename()
			}}
			onKeyDown={event => {
				if (event.nativeEvent.isComposing || ref_is_composing.current || event.keyCode === 229) {
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					submitRename()
				}

				if (event.key === 'Escape') {
					event.preventDefault()
					cancelRename()
				}
			}}
			ref={ref_input}
		></Input>
	)
}

export default $app.memo(Index)
