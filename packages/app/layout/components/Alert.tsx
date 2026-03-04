import { useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'

import { Alert } from '@/components'

export interface AlertArgs {
	title: string
	desc: string
	icon?: string
	onConfirm: () => void
	onCancel?: () => void
}

const initial = { title: '', desc: '', icon: '' } as AlertArgs

const Index = () => {
	const [open, setOpen] = useState(false)
	const [ctx, setCtx] = useState<AlertArgs>(initial)
	const p = useRef<PromiseWithResolvers<boolean>>(Promise.withResolvers<boolean>())

	const reset = useMemoizedFn(() => (p.current = Promise.withResolvers<boolean>()))

	const confirm = useMemoizedFn(() => {
		p.current.resolve(true)

		setOpen(false)
		reset()
	})

	const close = useMemoizedFn(() => {
		p.current.resolve(false)

		setOpen(false)
		reset()
	})

	const alert = useMemoizedFn(async (args: AlertArgs) => {
		setCtx(args)
		setOpen(true)

		return p.current.promise
	})

	useLayoutEffect(() => {
		$app.Event.on('app/alert', alert)

		return () => {
			$app.Event.off('app/alert', alert)
		}
	}, [])

	return (
		<Alert
			open={open}
			title={ctx.title}
			desc={ctx.desc}
			icon={ctx.icon}
			onConfirm={confirm}
			onCancel={close}
		></Alert>
	)
}

export default $app.memo(Index)
