declare module '*.css'
declare module '*.png'
declare module '*.jpg'
declare module '*.svg'
declare module '*.jpeg'
declare module '*.mp3'

declare module '*.svg?react' {
	import { FC, SVGProps } from 'react'

	const content: FC<SVGProps<SVGSVGElement>>

	export default content
}

declare module '@microflash/rehype-figure' {
	const fn: () => void

	export default fn
}

type Condition = boolean | string | number | React.ReactNode | undefined | any

declare function If(props: { condition: Condition; children: React.ReactNode }): any

declare function Choose(props: { children: React.ReactNode }): any
declare function When(props: { condition: Condition; children: React.ReactNode }): any
declare function Otherwise(props: { children: React.ReactNode }): any
