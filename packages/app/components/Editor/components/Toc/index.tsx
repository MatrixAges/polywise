import { TextSelection } from '@tiptap/pm/state'
import { useMemoizedFn } from 'ahooks'
import scrollIntoView from 'smooth-scroll-into-view-if-needed'

import Item from './Item'

import styles from './index.module.css'

import type { MouseEvent } from 'react'
import type { IPropsModalToc } from '../../types'

const Index = (props: IPropsModalToc) => {
	const { editor, toc } = props

	const onClick = useMemoizedFn((e: MouseEvent<HTMLAnchorElement>, id: string) => {
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
		<div className={$cx('box-border flex w-full flex-col', styles._local)}>
			<div
				className={`
					box-border
					flex flex-col
					w-full
					toc_items
				`}
			>
				{toc.map((item, index) => (
					<Item item={item} onClick={onClick} key={index}></Item>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)
