'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck, Check, CheckCircle, MarkdownLogo, Timer } from '@phosphor-icons/react'
import useLocale from '@website/hooks/useLocale'
import { $ } from '@website/utils'
import { Segmented } from 'antd'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('price')
	const { locale } = useLocale()
	const [type, setType] = useState<'pro' | 'infinity'>('pro')
	const is_cn = locale === 'zh'

	const currency = useMemo(() => (is_cn ? '¥' : '$'), [is_cn])

	return (
		<div
			className={$.cx(
				`
				box-border
				flex flex-col
				items-center
				w-full
			`,
				styles._local
			)}
		>
			<div className='price_items box-border flex w-full'>
				<div className='price_item box-border flex flex-col'>
					<div className='header_wrap flex items-center justify-between'>
						<h3 className='type'>{t(`Items.free.title`)}</h3>
						<div className='price'>
							<span className='value'>
								{currency}
								{t(`Items.free.price`)}
							</span>
						</div>
					</div>
					<div className='features box-border flex flex-col'>
						{Array.from({ length: 7 }).map((_, index) => (
							<div className='feature flex items-center' key={index}>
								<Check className='icon_check mr-1.5' weight='bold'></Check>
								<span className='desc'>{t(`Items.free.items.${index}`)}</span>
							</div>
						))}
					</div>
				</div>
				<div
					className='
						box-border
						flex flex-col
						price_item pro
					'
				>
					<div className='header_wrap flex items-center justify-between'>
						<Segmented
							options={[
								{
									label: t(`Items.pro.title`),
									value: 'pro'
								},
								{
									label: t(`Items.infinity.title`),
									value: 'infinity'
								}
							]}
							value={type}
							onChange={setType}
						></Segmented>
						<div className='price flex items-center'>
							<span className='value mr-0.5'>
								{currency}
								{type === 'pro' ? t(`Items.pro.price`) : t(`Items.infinity.price`)}
							</span>
							{type === 'pro' ? (
								<span className='unit'> / {t(`Items.unit`)}</span>
							) : (
								<span className='unit'> · {t(`Items.payonce`)}</span>
							)}
						</div>
					</div>
					<div className='features box-border flex flex-col'>
						{Array.from({ length: 4 }).map((_, index) => (
							<div className='feature flex items-center' key={index}>
								<Check className='icon_check' weight='bold'></Check>
								<span className='desc'>{t(`Items.pro.items.${index}`)}</span>
							</div>
						))}
						{Array.from({ length: 1 }).map((_, index) => (
							<div className='feature flex items-center' key={index}>
								<CheckCircle className='icon_feature' weight='bold'></CheckCircle>
								<span className='desc'>{t(`Items.pro.todo.${index}`)}</span>
							</div>
						))}
						{Array.from({ length: 1 }).map((_, index) => (
							<div className='feature flex items-center' key={index}>
								<MarkdownLogo className='icon_feature' weight='bold'></MarkdownLogo>
								<span className='desc'>{t(`Items.pro.note.${index}`)}</span>
							</div>
						))}
						{Array.from({ length: 1 }).map((_, index) => (
							<div className='feature flex items-center' key={index}>
								<Timer className='icon_feature' weight='bold'></Timer>
								<span className='desc'>{t(`Items.pro.pomo.${index}`)}</span>
							</div>
						))}
						{Array.from({ length: 1 }).map((_, index) => (
							<div className='feature flex items-center' key={index}>
								<CalendarCheck className='icon_feature' weight='bold'></CalendarCheck>
								<span className='desc'>{t(`Items.pro.schedule.${index}`)}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default $.memo(Index)
