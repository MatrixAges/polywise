import { useEffect, useMemo, useState } from 'react'
import { MultiFileDiff } from '@pierre/diffs/react'
import { useToggle } from 'ahooks'
import { CheckCircle, ChevronDown, ChevronRight, FileEdit, XCircle } from 'lucide-react'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/__shadcn__/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/__shadcn__/components/ui/tabs'

import type { IPropsEdit } from '../types'

const Index = (props: IPropsEdit) => {
	const { streaming, input, output } = props
	const [open, { toggle, set }] = useToggle(false)
	const [view_mode, setViewMode] = useState<'unified' | 'split'>('unified')

	useEffect(() => set(streaming), [streaming])

	const is_error = useMemo(() => output?.status === 'error', [output?.status])
	const edits = useMemo(() => output?.edits ?? [], [output?.edits])

	return (
		<Collapsible open={open} onOpenChange={toggle}>
			<div
				className={$cx(
					'
					flex flex-col
					gap-2
					mb-1
					rounded-md
					bg-secondary
				',
					!streaming && 'cursor-pointer'
				)}
			>
				<CollapsibleTrigger
					className='
						flex
						items-center
						gap-2
						p-3
						text-sm
					'
				>
					<div className='flex flex-1 items-center gap-2'>
						<FileEdit className='text-std-400 size-4' />
						<span className='font-medium'>edit_file_tool</span>
						{edits.length > 0 && (
							<Badge variant='secondary' className='text-xs'>
								{edits.length} {edits.length === 1 ? 'edit' : 'edits'}
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
					{open ? (
						<ChevronDown className='text-std-400 size-4' />
					) : (
						<ChevronRight className='text-std-400 size-4' />
					)}
				</CollapsibleTrigger>

				<CollapsibleContent>
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

						{!is_error && edits.length > 0 && (
							<div className='flex flex-col gap-4'>
								{edits.length > 1 && (
									<Tabs
										value={view_mode}
										onValueChange={v => setViewMode(v as 'unified' | 'split')}
									>
										<TabsList className='h-8'>
											<TabsTrigger
												value='unified'
												className='px-3 py-1 text-xs'
											>
												Unified
											</TabsTrigger>
											<TabsTrigger
												value='split'
												className='px-3 py-1 text-xs'
											>
												Split
											</TabsTrigger>
										</TabsList>
									</Tabs>
								)}

								{edits.length === 1 && (
									<div className='flex justify-end'>
										<Tabs
											value={view_mode}
											onValueChange={v =>
												setViewMode(v as 'unified' | 'split')
											}
										>
											<TabsList className='h-8'>
												<TabsTrigger
													value='unified'
													className='px-3 py-1 text-xs'
												>
													Unified
												</TabsTrigger>
												<TabsTrigger
													value='split'
													className='px-3 py-1 text-xs'
												>
													Split
												</TabsTrigger>
											</TabsList>
										</Tabs>
									</div>
								)}

								{edits.map((edit, index) => (
									<div key={index} className='flex flex-col gap-2'>
										{edits.length > 1 && (
											<div
												className='
													flex
													items-center
													gap-2
													text-xs text-muted-foreground
												'
											>
												<span className='font-medium'>
													Edit {index + 1}
												</span>
												<span className='text-std-400'>•</span>
												<span className='font-mono'>
													{edit.file_path}
												</span>
											</div>
										)}

										<div className='border-border overflow-hidden rounded-md border'>
											<MultiFileDiff
												oldFile={{
													name: edit.file_name,
													contents: edit.old_content,
													lang: edit.lang
												}}
												newFile={{
													name: edit.file_name,
													contents: edit.new_content,
													lang: edit.lang
												}}
												options={{
													diffStyle: view_mode,
													theme: {
														dark: 'github-dark',
														light: 'github-light'
													},
													themeType: 'system',
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
								))}
							</div>
						)}

						{!is_error && edits.length === 0 && !streaming && (
							<div className='text-muted-foreground text-sm'>No edits performed</div>
						)}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	)
}

export default $app.memo(Index)
