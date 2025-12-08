import { useRef, useState } from 'react'
import { useEventListener, useMemoizedFn } from 'ahooks'

export default () => {
	const [markup_visible, setMarkupVisible] = useState(false)
	const [markup_rect, setMarkupRect] = useState<DOMRect>()
	const selection_container = useRef<HTMLDivElement>(null)

	useEventListener(
		'mouseup',
		() => {
			const selection = window.getSelection()

			if (!selection) return

			const text = selection.toString()

			if (!text.length) return

			const range = selection.getRangeAt(0)
			const parent = range.commonAncestorContainer as HTMLElement

			let editable = false
			let el = parent

			while (el) {
				if (el.hasAttribute('contenteditable') && el.getAttribute('contenteditable')) {
					editable = true

					break
				}

				if (el.parentNode) {
					el = el.parentNode as HTMLElement
				} else {
					break
				}
			}

			if (!editable) return

			setMarkupVisible(true)
			setMarkupRect(range.getBoundingClientRect())
		},
		{ target: selection_container }
	)

	const closeMarkup = useMemoizedFn(() => setMarkupVisible(false))

	return { selection_container, markup_visible, markup_rect, closeMarkup }
}
