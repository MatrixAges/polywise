import 'react'

type AnyOnClickHandler<T> = React.MouseEventHandler<T> | ((...args: any[]) => any)

declare module 'react' {
	interface DragEvent {
		offsetX: number
		offsetY: number
	}

	interface CSSProperties {
		[key: string]: any
	}

	interface ButtonHTMLAttributes<T> {
		onClick?: AnyOnClickHandler<T>
	}

	interface HTMLAttributes<T> {
		onClick?: AnyOnClickHandler<T>
	}
}

declare global {
	interface DragEvent {
		rangeParent?: Node
		rangeOffset?: number
	}
}
