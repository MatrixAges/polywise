import 'react'

declare module 'react' {
	interface DragEvent {
		offsetX: number
		offsetY: number
	}

	interface CSSProperties {
		[key: string]: any
	}
}

declare module 'react-dom' {
	var prefetchDNS: (v: string) => void
}

declare global {
	interface DragEvent {
		rangeParent?: Node
		rangeOffset?: number
	}
}
