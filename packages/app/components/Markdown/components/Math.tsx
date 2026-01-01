import { useLayoutEffect, useRef } from 'react'
import katex from 'katex'
import { TriangleAlert } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

import type { PropsWithChildren } from 'react'

interface IProps extends PropsWithChildren {
	inline?: boolean
}

const Index = (props: IProps) => {
	const { children, inline } = props
	const ref = useRef(null)

	useLayoutEffect(() => {
		katex.render(children as string, ref.current!, {
			displayMode: !inline,
			errorColor: 'var(--color_danger)',
			output: 'html',
			strict: 'ignore',
			throwOnError: false,
			trust: false
		})
	}, [children, inline])

	return (
		<ErrorBoundary
			fallback={
				<div>
					<TriangleAlert size={18}></TriangleAlert>
				</div>
			}
		>
			{inline ? (
				<span className='math_wrap inline' ref={ref} spellCheck={false} tabIndex={-1} />
			) : (
				<div
					className='
						border_box
						math_wrap md_block w_100 text_center justify_center
					'
					ref={ref}
					spellCheck={false}
					tabIndex={-1}
				/>
			)}
		</ErrorBoundary>
	)
}

export default $app.memo(Index)
