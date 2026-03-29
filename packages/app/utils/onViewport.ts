export default (dom_node: HTMLElement, onViewportEnter: () => void, onViewportLeave: () => void): (() => void) => {
	const intersection_observer = new IntersectionObserver(entry_list => {
		entry_list.forEach(entry_item => {
			if (entry_item.isIntersecting) {
				onViewportEnter()
			} else {
				onViewportLeave()
			}
		})
	})

	intersection_observer.observe(dom_node)

	return () => {
		intersection_observer.disconnect()
	}
}
