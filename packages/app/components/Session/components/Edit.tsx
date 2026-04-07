import { useEffect } from 'react'
import { PatchDiff } from '@pierre/diffs/react'
import { useToggle } from 'ahooks'
import { ChevronDown, Columns2, PencilLine, SquareMenu } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import type { IPropsEdit } from '../types'

const Index = (props: IPropsEdit) => {
	const { streaming, output } = props
	const { status, file_name, file_path, patch, message } = output

	const global = useGlobal()
	const [open, { toggle, set }] = useToggle(false)
	const [unified, { toggle: toggleStyle }] = useToggle(true)

	const is_error = status === 'error'
	const has_patch = patch && patch.length > 0

	useEffect(() => set(streaming), [streaming])

	return (
		<div
			className={$cx(
				`
				flex flex-col
				mb-1
				group
			`,
				open && 'bg-secondary rounded-md'
			)}
			data-open={open}
		>
			<div
				className={$cx(
					`
					flex
					items-center
					gap-2
					text-muted-foreground text-sm
					hover:text-foreground
					cursor-pointer select-none
				`,
					open && 'justify-between px-3 py-2'
				)}
				onClick={toggle}
			>
				<div className='flex items-center gap-2'>
					<PencilLine className='text-std-400 size-3'></PencilLine>
					<span className='group-data-[open=true]:font-medium'>edit_file_tool</span>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-std-400 text-xs'>{file_name}</span>
					{open && (
						<ChevronDown
							className='
								size-4
								text-std-400
								transition-transform
							'
						/>
					)}
				</div>
			</div>
			{open && (
				<div
					className='
						flex flex-col
						gap-2
						p-3 pt-0
					'
				>
					{is_error && message && (
						<div
							className='
								p-3
								rounded-md
								text-destructive text-sm
								bg-destructive/10
							'
						>
							{message}
						</div>
					)}
					{!is_error && has_patch && (
						<div className='flex flex-col gap-1 pt-1'>
							<div className='text-muted-foreground flex items-center justify-between'>
								<span className='text-sm'>{file_path}</span>
								<span className='icon_button h-6 w-6' onClick={toggleStyle}>
									{unified ? (
										<SquareMenu size={12}></SquareMenu>
									) : (
										<Columns2 size={12}></Columns2>
									)}
								</span>
							</div>
							<div className='border-border overflow-hidden rounded-md border'>
								<PatchDiff
									patch={patch}
									options={{
										diffStyle: unified ? 'unified' : 'split',
										theme: {
											dark: 'github-dark',
											light: 'github-light'
										},
										themeType: global.theme.theme_value
									}}
									style={{
										'--diffs-font-size': '11.4px'
									}}
								/>
							</div>
						</div>
					)}
					{!is_error && !has_patch && !streaming && (
						<div className='text-muted-foreground text-sm'>No changes</div>
					)}
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
