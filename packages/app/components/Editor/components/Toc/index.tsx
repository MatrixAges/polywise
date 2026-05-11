import { TextSelection } from '@tiptap/pm/state'
import { useMemoizedFn } from 'ahooks'
import scrollIntoView from 'smooth-scroll-into-view-if-needed'

import Item from './Item'

import styles from './index.module.css'

import type { IPropsModalToc } from '../../types'

const Index = (props: IPropsModalToc) => {
	const { editor, toc } = props

	const onClick = useMemoizedFn((e, id) => {
		e.preventDefault()

		const element = editor.view.dom.querySelector(`[data-toc-id="${id}"`)!
		const pos = editor.view.posAtDOM(element, 0)

		const tr = editor.view.state.tr

		tr.setSelection(new TextSelection(tr.doc.resolve(pos)))

		editor.view.dispatch(tr)
		editor.view.focus()

		scrollIntoView(element, { behavior: 'smooth', block: 'center' })
	})

	return (
		<div className={$cx('w_100 border_box flex_column flex', styles._local)}>
			<div
				className='
					flex flex_column
					border_box
					toc_items w_100
				'
			>
				{toc.map((item, index) => (
					<Item item={item} onClick={onClick} key={index}></Item>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)
