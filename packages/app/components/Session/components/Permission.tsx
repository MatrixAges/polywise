import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'

import type { IPropsPermission } from '../types'

const Index = (props: IPropsPermission) => {
	const { permission, approvePermission } = props
	const { tool, action, path } = permission
	const { t } = useTranslation('components')

	return (
		<div
			className='
				flex flex-col
				gap-3
				p-3 pt-2
				rounded-md
				bg-secondary
			'
		>
			<div className='flex items-center gap-2'>
				<span className='text-warning text-sm font-medium'>{t('session.permission.title')}</span>
			</div>
			<div className='flex flex-col gap-1.5 text-xs'>
				<div className='flex gap-2'>
					<span className='text-std-500 w-10'>{t('session.permission.tool')}</span>
					<span className='font-mono'>{tool}</span>
				</div>

				<div className='flex gap-2'>
					<span className='text-std-500 w-10'>{t('session.permission.action')}</span>
					<span className='font-mono'>{action}</span>
				</div>

				<div className='flex gap-2'>
					<span className='text-std-500 w-10'>{t('session.permission.path')}</span>
					<span className='flex-1 font-mono break-all'>{path}</span>
				</div>
			</div>
			<div className='flex gap-2 self-end'>
				<Button size='sm' variant='outline' onClick={() => approvePermission(false)}>
					{t('session.permission.deny')}
				</Button>
				<Button size='sm' variant='default' onClick={() => approvePermission(true)}>
					{t('session.permission.allow')}
				</Button>
			</div>
		</div>
	)
}

export default $app.memo(Index)
