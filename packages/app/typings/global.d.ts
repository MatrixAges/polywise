import type { App } from '@/types'
import type { PrefixMap } from '@/utils'
import type SmoothScroll from '@/utils/SmoothScroll'
import type { ClassName } from 'clsx'
import type { GlobalERPC } from 'erpc/renderer'
import type { TFunction } from 'i18next'
import type Emittery from 'stk/emittery'
import type { handle, memo } from 'stk/react'

type $CX = (...args: Array<ClassName>) => string
type $Copy = <T>(input: T) => T

interface $App {
	memo: typeof memo
	handle: typeof handle
	Event: Emittery
}

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
		$copy: $Copy
		$cx: $CX

		$app: $App
		$message: MessageInstance
		$notification: NotificationInstance
		$modal: Omit<ModalStaticFunctions, 'warn'>
	}

	let $is_dev: boolean
	let $is_prod: boolean

	let $t: TFunction<'translation', undefined>
	let $copy: $Copy
	let $cx: $CX

	let $app: $App
	let $message: MessageInstance
	let $notification: NotificationInstance
	let $modal: Omit<ModalStaticFunctions, 'warn'>
}

export {}
