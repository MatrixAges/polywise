import { NodeViewWrapper } from '@tiptap/react'
import { useMemoizedFn } from 'ahooks'

import Render from './Render'

import styles from './index.module.css'

import type { ReactNodeViewProps } from '@tiptap/react'

const Index = (props: ReactNodeViewProps<HTMLDivElement>) => {
	const { editor, node, getPos } = props
	const { value } = node.attrs

	const onClick = useMemoizedFn(() => {
		editor.commands.showModal('mermaid', { value, pos: getPos() })
	})

	return (
		<NodeViewWrapper className={$cx('box-border w-full', styles.wrapper)}>
			<Render value={value} onClick={onClick}></Render>
		</NodeViewWrapper>
	)
}

export default $app.memo(Index)
