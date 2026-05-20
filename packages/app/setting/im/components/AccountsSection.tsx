import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Separator } from '@/__shadcn__/components/ui/separator'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'

const statusVariant = (status: string, enabled: boolean) => {
	if (!enabled) return 'outline'
	if (status === 'connected') return 'secondary'
	if (status === 'error') return 'destructive'
	return 'outline'
}

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				flex flex-col
				rounded-3xl
				bg-background/70
				border
			'
		>
			<div
				className='
					flex flex-wrap
					items-center justify-between
					gap-3
					px-4 py-3
				'
			>
				<div>
					<div className='text-sm font-medium'>Existing Accounts</div>
					<div className='text-std-500 text-sm'>
						Select an account to edit, or switch the header tabs to start a new draft
					</div>
				</div>
				<Badge variant='outline'>{x.accounts.length}</Badge>
			</div>
			<Separator />
			<div className='p-4'>
				{x.loading ? (
					<div className='flex items-center justify-center py-10'>
						<Spinner />
					</div>
				) : x.accounts.length ? (
					<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
						{x.accounts.map(account => (
							<button
								type='button'
								key={account.id}
								onClick={() => x.selectAccount(account)}
								className={`
										flex flex-col
										items-start
										gap-2
										px-4 py-3
										rounded-2xl
										text-left
										border
										transition
										${x.editorMode === 'edit' && x.selectedId === account.id ? 'border-foreground/20 bg-muted/70' : 'bg-muted/35 hover:bg-muted/55 border-transparent'}
								`}
							>
								<div
									className='
											flex
											items-center justify-between
											w-full
											gap-2
										'
								>
									<span className='font-medium'>
										{account.label || account.account_id}
									</span>
									<Badge variant={statusVariant(account.status, account.enabled)}>
										{account.enabled ? account.status : 'disabled'}
									</Badge>
								</div>
								<div className='text-std-500 text-sm'>
									{account.platform} · {account.account_id}
								</div>
								{account.last_error && (
									<div className='text-xs text-red-500'>{account.last_error}</div>
								)}
							</button>
						))}
					</div>
				) : (
					<div
						className='
								flex flex-wrap
								items-center justify-between
								gap-3
								px-4 py-6
								rounded-2xl
								bg-muted/35
							'
					>
						<div className='text-std-500 text-sm'>
							No IM accounts configured yet. Choose Discord or WeChat in the header and fill
							the form above.
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default observer(Index)
