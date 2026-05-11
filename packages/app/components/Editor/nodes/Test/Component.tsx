import { NodeViewWrapper } from '@tiptap/react'
import { useMemoizedFn } from 'ahooks'

import styles from './index.module.css'

import type { ReactNodeViewProps } from '@tiptap/react'

const Index = (props: ReactNodeViewProps<HTMLLabelElement>) => {
	const { updateAttributes, node } = props
	const { count } = node.attrs

	const increase = useMemoizedFn(() => {
		updateAttributes({ count: count + 1 })
	})

	return (
		<NodeViewWrapper className={$cx(styles._local, props.selected && 'ProseMirror-selectednode')}>
			<label>React Component</label>
			<div className='content'>
				<button onClick={increase}>This button has been clicked {count} times.</button>
			</div>
		</NodeViewWrapper>
	)
}

export default $app.memo(Index)
