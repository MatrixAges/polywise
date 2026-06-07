import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../index.module.css'

const Index = () => {
	const { t } = useTranslation()
	const plans = [
		{
			name: t('provider.coding_plan.open_code_go.name'),
			desc: t('provider.coding_plan.open_code_go.desc'),
			comment: t('provider.coding_plan.open_code_go.comment'),
			month: '$10',
			link: 'https://opencode.ai/go',
			tier1: true
		},
		{
			name: t('provider.coding_plan.xiaomi_mimo.name'),
			month: '$50',
			link: 'https://platform.xiaomimimo.com/token-plan',
			tier2: true
		},
		{
			name: t('provider.coding_plan.minimax.name'),
			month: '$20',
			link: 'https://platform.minimax.io/subscribe/coding-plan',
			tier2: true
		},
		{
			name: t('provider.coding_plan.bytedance_ark.name'),
			link: 'https://www.volcengine.com/activity/codingplan',
			tier3: true
		},
		{
			name: t('provider.coding_plan.aliyun_bailian.name'),
			link: 'https://www.aliyun.com/benefit/scene/codingplan',
			tier3: true
		}
	] as Array<{
		name: string
		desc?: string
		month?: string
		link: string
		comment?: string
		tier1?: boolean
		tier2?: boolean
		tier3?: boolean
	}>

	return (
		<div className='flex flex-col gap-2.5 pb-20'>
			<div className={styles.label}>{t('provider.coding_plan.title')}</div>
			<div
				className='
					flex flex-col
					w-full
					gap-3
					text-sm
				'
			>
				{plans.map(({ name, desc, link, month, comment, tier1, tier2, tier3 }) => (
					<a
						className={$cx(
							`
							flex
							items-center justify-between
							min-h-12
							px-4
							group
							clickit
						`,
							tier1 &&
								`
							flex-col
							py-6
							rounded-3xl
							border-border-light/80 border-b
						`,
							tier2 && 'rounded-full',
							(tier1 || tier2) && 'bg-std-50'
						)}
						target='_blank'
						href={link}
						key={name}
					>
						<div className='flex flex-col items-center'>
							<span
								className={$cx(
									`
									transition-all
									group-hover:underline
								`,
									tier1 && 'text-xl font-medium',
									tier3 && 'text-std-500'
								)}
							>
								{name}
							</span>
							{comment && (
								<span
									className='
										w-4/5
										mb-3
										text-base
										text-center
										desc
									'
								>
									{comment}
								</span>
							)}
							{desc && (
								<span
									className='
										w-4/5
										mb-4
										text-std-400
										text-center
										desc
									'
								>
									{desc}
								</span>
							)}
						</div>
						<div
							className='
								flex
								items-center
								gap-1
								text-std-400
								transition-all
								group-hover:text-std-black
							'
						>
							{month && (
								<span className='font-mono'>
									{month}
									{t('provider.coding_plan.per_month')}
								</span>
							)}
							<ArrowUpRight size={16}></ArrowUpRight>
						</div>
					</a>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)
