import 'react'

declare module 'react' {
	interface DragEvent {
		offsetX: number
		offsetY: number
	}

	interface CSSProperties {
		[key: string]: any
	}

	interface ButtonHTMLAttributes<T> {
		onClick?: React.MouseEventHandler<T> | ((v: any) => any)
	}

	interface HTMLAttributes<T> {
		onClick?: React.MouseEventHandler<T> | ((v: any) => any)
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
