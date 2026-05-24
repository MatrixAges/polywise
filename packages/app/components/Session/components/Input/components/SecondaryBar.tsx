import { Archive, ArrowDownToLine, BrushCleaning, Layers2, PackageOpen } from 'lucide-react'
import { observer } from 'mobx-react-lite'

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
import { audit_modes, submit_modes } from '../utils'

const Index = () => {
	const x = useModel()
	const RightArchiveIcon = x.props.archived ? PackageOpen : Archive

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
				{x.props.show_audit_mode_select && (
					<Select
						items={audit_modes}
						value={x.props.audit_mode}
						onValueChange={value => value && x.props.setAuditMode(value)}
					>
						<SelectTrigger
							className={$cx(
								`
								h-auto!
								p-0
								text-xs
								bg-transparent
							`,
								x.props.audit_mode === 'full'
									? 'text-red-700/72 dark:text-red-300/72'
									: 'text-std-400'
							)}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className='w-[150px]' align='start'>
							<SelectGroup>
								<SelectLabel>Audit Mode</SelectLabel>
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
							<SelectLabel>Submit Mode</SelectLabel>
							{submit_modes.map(item => (
								<SelectItem value={item.value} key={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<Tooltip title='Clear'>
					<div className='icon_button h-5 w-5' onClick={x.props.clear}>
						<BrushCleaning className='stroke-std-400 h-[12px] w-[12px]'></BrushCleaning>
					</div>
				</Tooltip>
				<Show visible={x.props.archived}>
					<Tooltip title='Unarchive'>
						<div className='icon_button h-5 w-5' onClick={x.props.unarchive}>
							<RightArchiveIcon className='stroke-std-400 h-[12px] w-[12px]'></RightArchiveIcon>
						</div>
					</Tooltip>
				</Show>
			</div>
			<div className='flex gap-1'>
				<Tooltip title='Context'>
					<div className='icon_button h-5 w-5' onClick={x.props.toggleContextModal}>
						<Layers2 className='stroke-std-400 h-[12px] w-[12px]'></Layers2>
					</div>
				</Tooltip>
				<Tooltip title='Scroll to bottom'>
					<div className='icon_button h-5 w-5' onClick={x.props.scrollToBottom}>
						<ArrowDownToLine className='stroke-std-400 h-[12px] w-[12px]'></ArrowDownToLine>
					</div>
				</Tooltip>
				<Tooltip title='Archive'>
					<div className='icon_button h-5 w-5' onClick={x.props.archive}>
						<Archive className='stroke-std-400 h-[12px] w-[12px]'></Archive>
					</div>
				</Tooltip>
			</div>
		</div>
	)
}

export default observer(Index)
