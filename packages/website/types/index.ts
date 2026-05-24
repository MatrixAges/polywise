import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

export interface TocItem {
	key: string
	title: ReactNode
	href: string
	level: number
	children?: TocItem[]
}

export interface DocsMenuItem {
	key: string
	className: string
	label: string
	icon: ReactNode
}

export interface DocsMenuGroup {
	key: string
	label: string
	children: DocsMenuItem[]
}

export type ArgsSmoothScroll = Partial<{
	animationTime: number // [ms]
	stepSize: number // [px]

	accelerationDelta: number // 50
	accelerationMax: number // 3

	keyboardSupport: boolean // option
	arrowScroll: number // [px]

	pulseAlgorithm: boolean
	pulseScale: number
	pulseNormalize: number

	touchpadSupport: boolean
	fixedBackground: boolean
	excluded: string
}>

export type ArgsAmbientBg = Partial<{
	dom: HTMLElement
	colors: Array<string>
	loop?: boolean
}>
