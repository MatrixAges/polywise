import 'react'

declare module 'react' {
	export const unstable_Activity: ComponentClass<
		{
			children: ReactNode
			mode: 'hidden' | 'visible'
		},
		any
	>

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
