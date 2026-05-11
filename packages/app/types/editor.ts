import type { Editor } from '@tiptap/core'
import type { ReactRenderer } from '@tiptap/react'
import type { ReactPortal } from 'react'

export type EditorWithContentComponent = Editor & { contentComponent: ContentComponent | null }

export type ContentComponent = {
	subscribe: (callback: () => void) => () => void
	unsubscribe: () => void
	setRenderer(id: string, renderer: ReactRenderer): void
	removeRenderer(id: string): void
	getSnapshot: () => Record<string, ReactPortal>
	getServerSnapshot: () => Record<string, ReactPortal>
}
