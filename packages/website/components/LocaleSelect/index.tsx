'use client'

import { useMemo } from 'react'
import { Select } from '@base-ui/react/select'
import { CaretDown, Check } from '@phosphor-icons/react'
import { locales } from '@website/app.config'
import useLocale from '@website/hooks/useLocale'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const { locale, setLocale } = useLocale()
	const t_common = useTranslations('common')
	const select_id = 'footer-locale-select'

	const locale_options = useMemo(() => {
		return locales.map(item => ({ label: t_common(`lang.${item}`), value: item }))
	}, [t_common])

	return (
		<Select.Root
			id={select_id}
			value={locale}
			items={locale_options}
			onValueChange={value => value && setLocale(value)}
		>
			<Select.Trigger
				className={$.cx(
					styles._local,
					`
					flex
					items-center justify-between
					w-[90px] h-9
					px-3
					rounded-[var(--radius)]
					text-xs text-[var(--color_text_sub)]
					bg-[var(--color_bg_1)]
					border border-[var(--color_border_light)]
					transition-colors duration-200
					hover:bg-[var(--color_bg_2)]
				`
				)}
			>
				<Select.Value />
				<Select.Icon className='text-[var(--color_text_light)]'>
					<CaretDown size={12} />
				</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Positioner align='end' side='bottom' sideOffset={8}>
					<Select.Popup
						className='
							z-1200
							min-w-30
							p-1
							rounded-xl
							bg-[var(--color_bg)]
							border border-[var(--color_border_light)]
							shadow-[0_18px_48px_rgba(0,0,0,0.18)]
							duration-200
							transition data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[ending-style]:opacity-0
						'
					>
						<Select.List className='flex flex-col gap-1'>
							{locale_options.map(option => (
								<Select.Item
									className='
										flex
										items-center justify-between
										px-3 py-2
										rounded-lg
										text-sm text-[var(--color_text_sub)]
										outline-none
										transition-colors duration-200
										hover:bg-[var(--color_bg_1)]
										cursor-pointer data-[highlighted]:bg-[var(--color_bg_1)] data-[selected]:text-[var(--color_text)]
									'
									key={option.value}
									value={option.value}
								>
									<Select.ItemText>{option.label}</Select.ItemText>
									<Select.ItemIndicator className='text-[var(--color_text)]'>
										<Check size={14} weight='bold' />
									</Select.ItemIndicator>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	)
}

export default $.memo(Index)
