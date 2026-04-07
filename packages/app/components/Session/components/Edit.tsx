import { useEffect, useState } from 'react'
import { PatchDiff } from '@pierre/diffs/react'
import { useToggle } from 'ahooks'
import { CheckCircle, FileEdit, XCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/__shadcn__/components/ui/tabs'
import { useGlobal } from '@/context'

import type { IPropsEdit } from '../types'

const Index = (props: IPropsEdit) => {
	const { streaming, output } = props

	const global = useGlobal()
	const [open, { toggle, set }] = useToggle(false)
	const [view_mode, setViewMode] = useState<'unified' | 'split'>('unified')

	useEffect(() => set(streaming), [streaming])

	const is_error = output?.status === 'error'
	const has_patch = output?.patch && output.patch.length > 0

	return (
		<div
			className={$cx(
				`
				flex flex-col
				gap-2
				mb-1
				rounded-md
				bg-secondary
			`,
				!streaming && 'cursor-pointer'
			)}
		>
			<div className='flex flex-1 items-center gap-2' onClick={toggle}>
				<FileEdit className='text-std-400 size-4' />
				<span className='font-medium'>edit_file_tool</span>
				{output?.file_path && (
					<span className='text-muted-foreground font-mono text-xs'>{output.file_path}</span>
				)}
				{output && output.edit_count > 1 && (
					<Badge variant='secondary' className='text-xs'>
						{output.edit_count} edits
					</Badge>
				)}
				{output && (
					<Badge
						variant={is_error ? 'destructive' : 'default'}
						className={$cx('text-xs', !is_error && 'bg-green-600')}
					>
						{is_error ? (
							<>
								<XCircle className='mr-1 size-3' />
								Error
							</>
						) : (
							<>
								<CheckCircle className='mr-1 size-3' />
								Success
							</>
						)}
					</Badge>
				)}
			</div>
			{open && (
				<div
					className='
						flex flex-col
						gap-4
						px-3
						pb-3
					'
				>
					{is_error && output?.message && (
						<div
							className='
								p-3
								rounded-md
								text-destructive text-sm
								bg-destructive/10
							'
						>
							{output.message}
						</div>
					)}
					{!is_error && has_patch && (
						<div className='flex flex-col gap-4'>
							<div className='flex justify-end'>
								<Tabs
									value={view_mode}
									onValueChange={v => setViewMode(v as 'unified' | 'split')}
								>
									<TabsList className='h-8'>
										<TabsTrigger value='unified' className='px-3 py-1 text-xs'>
											Unified
										</TabsTrigger>
										<TabsTrigger value='split' className='px-3 py-1 text-xs'>
											Split
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
							<div className='border-border overflow-hidden rounded-md border'>
								<PatchDiff
									patch={output!.patch}
									options={{
										diffStyle: view_mode,
										theme: {
											dark: 'github-dark',
											light: 'github-light'
										},
										themeType: global.theme.theme_value,
										diffIndicators: 'bars',
										lineDiffType: 'word-alt',
										disableLineNumbers: false,
										overflow: 'scroll',
										hunkSeparators: 'line-info',
										expandUnchanged: true,
										collapsedContextThreshold: 3
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
