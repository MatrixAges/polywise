import { Button } from '@/__shadcn__/components/ui/button'

import type { IPropsPermission } from '../types'

const Index = (props: IPropsPermission) => {
	const { permission, approvePermission } = props
	const { tool, action, path } = permission

	return (
		<div
			className={$cx(`
				flex flex-col
				gap-3
				p-3
				rounded-md
				bg-secondary
				border border-warning
			`)}
		>
			<div className='flex items-center gap-2'>
				<span className='text-warning text-sm font-medium'>权限请求</span>
			</div>

			<div className='flex flex-col gap-1.5 text-xs'>
				<div className='flex gap-2'>
					<span className='text-std-500'>工具</span>
					<span className='font-mono'>{tool}</span>
				</div>

				<div className='flex gap-2'>
					<span className='text-std-500'>操作</span>
					<span className='font-mono'>{action}</span>
				</div>

				<div className='flex gap-2'>
					<span className='text-std-500'>路径</span>
					<span className='font-mono break-all'>{path}</span>
				</div>
			</div>

			<div className='flex gap-2 self-end'>
				<Button size='sm' variant='default' onClick={() => approvePermission(true)}>
					允许
				</Button>

				<Button size='sm' variant='outline' onClick={() => approvePermission(false)}>
					拒绝
				</Button>
			</div>
		</div>
	)
}

export default $app.memo(Index)
