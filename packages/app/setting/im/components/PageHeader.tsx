import { MessageCircle, Plus, RefreshCw } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'

const PageHeader = () => {
	const x = useModel()

	return (
		<div
			className='
				flex flex-wrap
				items-start justify-between
				gap-3
			'
		>
			<div className='flex flex-col gap-1'>
				<div className='flex items-center gap-2'>
					<div className='bg-muted rounded-2xl p-2'>
						<MessageCircle className='size-4' />
					</div>
					<div>
						<div className='text-lg font-semibold'>IM Integration</div>
						<div className='text-std-500 text-sm'>
							Configure Discord and WeChat accounts for the IM runtime
						</div>
					</div>
				</div>
			</div>
			<div className='flex items-center gap-2'>
				<Button type='button' variant='outline' onClick={() => x.createNew({ reveal: true })}>
					<Plus className='size-4' />
					<span>New Account</span>
				</Button>
				<Button type='button' variant='outline' onClick={() => void x.reload()} disabled={x.reloading}>
					{x.reloading ? <Spinner className='size-4' /> : <RefreshCw className='size-4' />}
					<span>Reload Runtime</span>
				</Button>
			</div>
		</div>
	)
}

export default observer(PageHeader)
