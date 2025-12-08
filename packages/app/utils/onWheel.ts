import type { ContextType, WheelEvent } from 'react'
import type { VisibilityContext } from 'react-horizontal-scrolling-menu'

export default (scroller: ContextType<typeof VisibilityContext>, e: WheelEvent) => {
	const is_thouchpad = Math.abs(e.deltaX) !== 0 || Math.abs(e.deltaY) < 15

	if (is_thouchpad) return e.stopPropagation()

	if (e.deltaY > 0) {
		scroller.scrollNext()
	}

	if (e.deltaY < 0) {
		scroller.scrollPrev()
	}
}
