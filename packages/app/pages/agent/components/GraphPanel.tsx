import { GitBranch } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import type { AgentItem } from '../types'

interface IProps {
	agent: AgentItem
}

const Index = ({ agent }: IProps) => {
	const { t } = useTranslation('agent')

	return (
		<div
			className='
				flex flex-1
				items-center justify-center
				h-full
				px-6 py-8
			'
		>
			<div
				className='
					flex flex-col
					items-center
					max-w-sm
					gap-3
					text-center
				'
			>
				<div
					className='
						flex
						items-center justify-center
						size-11
						rounded-full
						text-std-500
						bg-secondary/70
					'
				>
					<GitBranch className='size-5'></GitBranch>
				</div>
				<div className='text-std-900 text-sm font-medium'>{t('detail.graph')}</div>
				<div className='text-std-400 text-sm'>
					{t('detail.graph_unavailable', {
						name: agent.name || t('detail.this_agent')
					})}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
