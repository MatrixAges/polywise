import { EditorContent } from '@tiptap/react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

import styles from '../index.module.css'

import type { Editor } from '@tiptap/react'

interface Props {
	editor: Editor | null
}

const Index = ({ editor }: Props) => {
	const x = useModel()

	return (
		<div className={$cx(styles.input_editor, x.full && styles.input_editor_full)}>
			<EditorContent
				className='session-input-editor bg-transparent'
				editor={editor}
				onKeyDownCapture={x.onSubmit}
			/>
		</div>
	)
}

export default observer(Index)
