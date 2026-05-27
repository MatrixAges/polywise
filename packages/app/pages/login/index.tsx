import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { useGlobal } from '@/context'
import getAppRouteHref from '@/utils/getAppRouteHref'

const Index = () => {
	const global = useGlobal()
	const auth = global.auth
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const onSubmit = async () => {
		if (!password.trim()) {
			toast.error('Password is required.')
			return
		}

		setLoading(true)

		try {
			await auth.login(password)
			window.location.href = getAppRouteHref('/')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			className='
				flex
				items-center justify-center
				w-full
				min-h-screen
				px-6
				bg-[radial-gradient(circle_at_top,_rgba(27,87,255,0.16),_transparent_38%),linear-gradient(160deg,_var(--bg-layout-under),_var(--bg-layout-over))]
			'
		>
			<div
				className='
					w-full max-w-[420px]
					p-7
					rounded-2xl
					bg-layout-over/95
					border border-border-light/80
					shadow-2xl
					backdrop-blur
				'
			>
				<div className='mb-6 flex items-center gap-3'>
					<div
						className='
							flex
							items-center justify-center
							size-11
							rounded-2xl
							text-white
							bg-std-900
						'
					>
						<ShieldCheck className='size-5'></ShieldCheck>
					</div>
					<div>
						<div className='text-lg font-semibold'>Polywise Login</div>
						<div className='text-std-500 text-sm'>Sign in to the standalone web runtime.</div>
					</div>
				</div>
				<div className='mb-4 space-y-3'>
					<div>
						<div
							className='
								mb-1.5
								text-std-500 text-xs tracking-[0.16em]
								uppercase
							'
						>
							Account
						</div>
						<Input readOnly value={auth.status?.username || 'polywiser'}></Input>
					</div>
					<div>
						<div
							className='
								mb-1.5
								text-std-500 text-xs tracking-[0.16em]
								uppercase
							'
						>
							Password
						</div>
						<Input
							type='password'
							value={password}
							onChange={event => setPassword(event.target.value)}
							onKeyDown={event => {
								if (event.key === 'Enter') {
									void onSubmit()
								}
							}}
						></Input>
					</div>
				</div>
				<div className='space-y-3'>
					<Button className='w-full' onClick={() => void onSubmit()} disabled={loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</Button>
					{auth.bootstrapRequired && (
						<Link
							className='
								block
								text-std-500 text-sm
								underline
								underline-offset-4
								text-center
							'
							to='/setting'
						>
							No password configured yet. Set it in Settings.
						</Link>
					)}
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
