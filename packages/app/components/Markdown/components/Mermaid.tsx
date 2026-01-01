import { useLayoutEffect, useRef } from 'react'
import { TriangleAlert } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

import { useSize } from '@/hooks'
import { mermaidRender } from '@/utils'

import type { PropsWithChildren } from 'react'

const Index = (props: PropsWithChildren) => {
	const { children } = props
	const ref = useRef(null)
	const width = useSize(() => ref.current!, 'width') as number

	useLayoutEffect(() => {
		mermaidRender({ content: children as string, container: ref.current!, theme: 'light', width })
	}, [children, width])

	return (
		<ErrorBoundary
			fallback={
				<div>
					<TriangleAlert size={18}></TriangleAlert>
				</div>
			}
		>
			<div
				className='
					border_box
					mermaid_wrap md_block w_100 text_center justify_center
				'
				ref={ref}
				role='button'
				spellCheck={false}
				tabIndex={-1}
			/>
		</ErrorBoundary>
	)
}

export default $app.memo(Index)
