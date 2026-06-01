declare module '*.css'
declare module '*.png'
declare module '*.jpeg'
declare module '*.svg'

declare module '*.svg?react' {
	import { FC, SVGProps } from 'react'

	const content: FC<SVGProps<SVGSVGElement>>

	export default content
}

declare module '*.inline.svg' {
	const content: string
	export default content
}

declare module 'cloudflare:workers' {
	export const env: Env
}

declare function If(props: { condition: boolean; children: React.ReactNode }): any
declare function Choose(props: { children: React.ReactNode }): any
declare function When(props: { condition: boolean; children: React.ReactNode }): any
declare function Otherwise(props: { children: React.ReactNode }): any
