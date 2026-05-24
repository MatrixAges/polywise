import { EditorContent } from '@tiptap/react'

import { useModel } from '../context'

import styles from '../index.module.css'

const Index = () => {
	const x = useModel()

	return (
		<div className={$cx(styles.input_editor, x.full && styles.input_editor_full)}>
			<EditorContent
				className='session-input-editor bg-transparent'
				editor={x.editor}
				onKeyDownCapture={x.onSubmit}
			/>
		</div>
	)
}

export default Index
