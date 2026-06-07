import { Archive, ArrowDownToLine, BrushCleaning, Layers2, PackageOpen } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Show, Tooltip } from '@/components'

import { useModel } from '../context'
import { getAuditModes, getSubmitModes } from '../utils'

import type { IPropsInput } from '../../../types'

type Props = Pick<
	IPropsInput,
	| 'archive'
	| 'archived'
	| 'audit_mode'
	| 'clear'
	| 'scrollToBottom'
	| 'setAuditMode'
	| 'show_audit_mode_select'
	| 'toggleContextModal'
	| 'unarchive'
>

const Index = (props: Props) => {
	const x = useModel()
	const { t } = useTranslation('components')
	const RightArchiveIcon = props.archived ? PackageOpen : Archive
	const audit_modes = getAuditModes(t)
	const submit_modes = getSubmitModes(t)

	return (
		<div
			className='
				flex
				items-center justify-between
				w-full
				px-2 py-1.5
				text-xs
			'
		>
			<div className='flex gap-1.5'>
				{props.show_audit_mode_select && (
					<Select
						items={audit_modes}
						value={props.audit_mode}
						onValueChange={value => value && props.setAuditMode(value)}
					>
						<SelectTrigger
							className={$cx(
								`
								h-auto!
								p-0
								text-xs
								bg-transparent
							`,
								props.audit_mode === 'full'
									? 'text-red-700/72 dark:text-red-300/72'
									: 'text-std-400'
							)}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className='w-[150px]' align='start'>
							<SelectGroup>
								<SelectLabel>{t('session.input.audit_mode')}</SelectLabel>
								{audit_modes.map(item => (
									<SelectItem value={item.value} key={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}
				<Select
					items={submit_modes}
					value={x.setting.config?.submit_mode ?? 'enter'}
					onValueChange={value => value && x.onChangeSubmitMode(value)}
				>
					<SelectTrigger
						className='
							h-auto!
							p-0
							text-xs text-std-400
							bg-transparent
						'
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent className='w-[150px]' align='start'>
						<SelectGroup>
							<SelectLabel>{t('session.input.submit_mode')}</SelectLabel>
							{submit_modes.map(item => (
								<SelectItem value={item.value} key={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<Tooltip title={t('session.input.clear')}>
					<div className='icon_button h-5 w-5' onClick={props.clear}>
						<BrushCleaning className='stroke-std-400 h-[12px] w-[12px]'></BrushCleaning>
					</div>
				</Tooltip>
				<Show visible={props.archived}>
					<Tooltip title={t('session.input.unarchive')}>
						<div className='icon_button h-5 w-5' onClick={props.unarchive}>
							<RightArchiveIcon className='stroke-std-400 h-[12px] w-[12px]'></RightArchiveIcon>
						</div>
					</Tooltip>
				</Show>
			</div>
			<div className='flex gap-1'>
				<Tooltip title={t('session.input.context')}>
					<div className='icon_button h-5 w-5' onClick={props.toggleContextModal}>
						<Layers2 className='stroke-std-400 h-[12px] w-[12px]'></Layers2>
					</div>
				</Tooltip>
				<Tooltip title={t('session.input.scroll_to_bottom')}>
					<div className='icon_button h-5 w-5' onClick={props.scrollToBottom}>
						<ArrowDownToLine className='stroke-std-400 h-[12px] w-[12px]'></ArrowDownToLine>
					</div>
				</Tooltip>
				<Tooltip title={t('session.input.archive')}>
					<div className='icon_button h-5 w-5' onClick={props.archive}>
						<Archive className='stroke-std-400 h-[12px] w-[12px]'></Archive>
					</div>
				</Tooltip>
			</div>
		</div>
	)
}

export default observer(Index)
