import type { App } from '@/types'
import type { PrefixMap } from '@/utils'
import type SmoothScroll from '@/utils/SmoothScroll'
import type { ClassValue } from 'clsx'
import type { GlobalERPC } from 'erpc/renderer'
import type { TFunction } from 'i18next'
import type { EffectCallback } from 'react'
import type Emittery from 'stk/emittery'
import type { Handle, memo } from 'stk/react'

type $CX = (...args: Array<ClassValue>) => string
type $Copy = <T>(input: T) => T

interface $App {
	memo: typeof memo
	Handle: typeof Handle
	Event: Emittery
}

type $AliveUnmountedSet = Set<ReturnType<EffectCallback>>

declare global {
	interface $Env {
		port: string
		client_id: string
	}

	interface Window {
		$erpc?: GlobalERPC
		$env: $Env

		$shell?: {
			type: 'electron'
			platform: 'darwin' | 'win32'
			getEnv: () => Promise<$Env>
			stopLoading: () => void
			getPathForFile: (file: File) => {
				name: string
				path: string
			}
		}

		$is_dev: boolean
		$is_prod: boolean

		$t: TFunction<'translation', undefined>
		$app: $App

		$copy: $Copy
		$cx: $CX
	}

	let $is_dev: boolean
	let $is_prod: boolean

	let $t: TFunction<'translation', undefined>
	let $app: $App

	let $copy: $Copy
	let $cx: $CX
}

export {}
