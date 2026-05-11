import { useEffect, useRef } from 'react'
import { WarningIcon } from '@phosphor-icons/react'
import katex from 'katex'
import { ErrorBoundary } from 'react-error-boundary'

interface IProps {
	value: string
	inline?: boolean
}

const Index = (props: IProps) => {
	const { value, inline } = props
	const ref = useRef(null)

	useEffect(() => {
		const el = ref.current

		if (!el || !value) return

		katex.render(value, el, {
			displayMode: !inline,
			errorColor: 'var(--color_danger)',
			output: 'html',
			strict: 'warn',
			throwOnError: false,
			trust: false
		})
	}, [value, inline])

	return (
		<ErrorBoundary
			fallback={
				<div>
					<WarningIcon size={18}></WarningIcon>
				</div>
			}
		>
			<img src='#' alt='' />
			<span ref={ref} role='button' tabIndex={-1} />
			<img src='#' alt='' />
		</ErrorBoundary>
	)
}

export default $app.memo(Index)
