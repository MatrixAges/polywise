'use client'

import { OpenAiLogoIcon, TreeStructureIcon, UserIcon } from '@phosphor-icons/react'
import Logo from '@website/components/Logo'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('index')

	return (
		<section className='limited_content_wrap section_wrap'>
			<div
				className={$.cx(
					`
					relative
					flex flex-col
					items-center
					w-full
				`,
					styles._local
				)}
			>
				<h2 className='section_title'>{t('Why_if.title')}</h2>
				<h3 className='section_desc'>{t('Why_if.subtitle')}</h3>
				<div
					className='
						relative
						box-border
						flex flex-col
						items-center
						role_wrap
					'
				>
					<div className='user_border absolute'></div>
					<div
						className='
							box-border
							flex flex-col
							items-center justify-center
							user_wrap role_item lightcard top
						'
					>
						<UserIcon weight='light'></UserIcon>
						<span className='name'>{t('Why_if.roles.user')}</span>
					</div>
					<div
						className='
							box-border
							flex
							items-center justify-center
							if_wrap role_item lightcard top
						'
					>
						<Logo size={36} color='var(--color_text)'></Logo>
					</div>
					<div className='relative flex justify-between'>
						<div className='angled_border_right angled_border'></div>
						<div className='angled_border_left angled_border'></div>
						<div
							className='
								box-border
								flex flex-col
								items-center justify-center
								ai_wrap role_item lightcard top bottom
							'
						>
							<OpenAiLogoIcon weight='thin'></OpenAiLogoIcon>
							<span className='name'>{t('Why_if.roles.ai')}</span>
						</div>
						<div
							className='
								box-border
								flex flex-col
								items-center justify-center
								api_wrap role_item lightcard top bottom
							'
						>
							<TreeStructureIcon weight='thin'></TreeStructureIcon>
							<span className='name'>{t('Why_if.roles.dataflow')}</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)
