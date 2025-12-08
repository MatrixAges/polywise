import type { App } from '@/types'
import type { PrefixMap } from '@/utils'
import type SmoothScroll from '@/utils/SmoothScroll'
import type { MessageInstance } from 'antd/es/message/interface'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import type { NotificationInstance } from 'antd/es/notification/interface'
import type { GlobalERPC } from 'erpc/renderer'
import type { TFunction } from 'i18next'
import type { memo } from 'react'
import type Emittery from 'stk/emittery'
import type { handle } from 'stk/react'

type $CX = (...args: Array<string | boolean | number | null | undefined>) => string
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
