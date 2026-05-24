import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

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
