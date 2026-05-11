import { createPortal } from 'react-dom'

import type { ReactRenderer } from '@tiptap/react'

export default () => {
	const subscribers = new Set<() => void>()

	let renderers: Record<string, React.ReactPortal> = {}

	return {
		subscribe(callback: () => void) {
			subscribers.add(callback)

			return () => {
				subscribers.delete(callback)
			}
		},
		unsubscribe() {
			subscribers.forEach(item => subscribers.delete(item))
		},
		getSnapshot() {
			return renderers
		},
		getServerSnapshot() {
			return renderers
		},
		setRenderer(id: string, renderer: ReactRenderer) {
			renderers = {
				...renderers,
				[id]: createPortal(renderer.reactElement, renderer.element, id)
			}

			subscribers.forEach(subscriber => subscriber())
		},
		removeRenderer(id: string) {
			const nextRenderers = { ...renderers }

			delete nextRenderers[id]

			renderers = nextRenderers

			subscribers.forEach(subscriber => subscriber())
		}
	}
}
