'use client'

import { createContext, useContext } from 'react'
import { Toast } from '@base-ui/react/toast'
import { CheckCircle, Info, WarningCircle, X } from '@phosphor-icons/react'
import { $ } from '@website/utils'

import type { PropsWithChildren } from 'react'

type ToastType = 'success' | 'info' | 'warning'

interface ToastApi {
	success: (description: string) => void
	info: (description: string) => void
	warning: (description: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const icon_map = {
	success: CheckCircle,
	info: Info,
	warning: WarningCircle
} as const

const Inner = ({ children }: PropsWithChildren) => {
	const { add, toasts } = Toast.useToastManager()

	const api = {
		success: (description: string) => add({ description, type: 'success' }),
		info: (description: string) => add({ description, type: 'info' }),
		warning: (description: string) => add({ description, type: 'warning' })
	} as ToastApi

	return (
		<ToastContext.Provider value={api}>
			{children}
			<Toast.Portal>
				<Toast.Viewport className='sr-only' />
				<div
					className='
						fixed
						right-4 bottom-4
						z-1200
						flex flex-col
						w-[min(360px,calc(100vw-32px))]
						gap-3
						pointer-events-none
					'
				>
					{toasts.map(toast => {
						const type = (toast.type as ToastType | undefined) ?? 'info'
						const Icon = icon_map[type]

						return (
							<Toast.Root
								toast={toast}
								key={toast.id}
								className={$.cx(
									`
								w-full
								p-4
								rounded-2xl
								text-[var(--color_text)]
								bg-[rgba(var(--color_bg_rgb),0.94)]
								border border-[var(--color_border_light)]
								shadow-[0_20px_60px_rgba(0,0,0,0.18)]
								backdrop-blur-xl
								duration-200
								pointer-events-auto transition
							`,
									'data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0'
								)}
							>
								<div className='flex items-start gap-3'>
									<div className='mt-0.5 text-[var(--color_text)]'>
										<Icon size={18} weight='fill' />
									</div>
									<div
										className='
										flex-1
										min-w-0
										text-sm text-[var(--color_text_sub)] leading-6
									'
									>
										<Toast.Description />
									</div>
									<Toast.Close
										aria-label='Close notification'
										className='
										flex
										items-center justify-center
										w-7 h-7
										rounded-full
										text-[var(--color_text_light)]
										transition-colors duration-200
										hover:bg-[var(--color_bg_1)] hover:text-[var(--color_text)]
									'
									>
										<X size={14} />
									</Toast.Close>
								</div>
							</Toast.Root>
						)
					})}
				</div>
			</Toast.Portal>
		</ToastContext.Provider>
	)
}

export const useAppToast = () => {
	const context = useContext(ToastContext)

	if (!context) {
		throw new Error('useAppToast must be used within ToastProvider')
	}

	return context
}

const Index = ({ children }: PropsWithChildren) => {
	return (
		<Toast.Provider limit={4} timeout={2400}>
			<Inner>{children}</Inner>
		</Toast.Provider>
	)
}

export default Index
