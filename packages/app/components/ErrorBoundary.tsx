import { ErrorBoundary } from 'react-error-boundary'

import { Button } from '@/__shadcn__/components/ui/button'

import type { PropsWithChildren } from 'react'

const ErrorFallback = () => {
	const handleReload = () => {
		window.location.reload()
	}

	return (
		<div
			className='
				fixed
				inset-0
				z-999999
				flex
				items-center justify-center
				w-screen h-screen
				p-6
				bg-background
			'
		>
			<div
				className='
					flex flex-col
					items-center
					w-full max-w-sm
					gap-4
					text-center
				'
			>
				<h1 className='text-2xl font-semibold tracking-tight'>Something went wrong</h1>
				<p className='text-muted-foreground text-sm'>Unexpected error occurred.</p>
				<Button onClick={handleReload}>Reload page</Button>
			</div>
		</div>
	)
}

const Index = ({ children }: PropsWithChildren) => {
	return <ErrorBoundary fallback={<ErrorFallback />}>{children}</ErrorBoundary>
}

export default $app.memo(Index)
