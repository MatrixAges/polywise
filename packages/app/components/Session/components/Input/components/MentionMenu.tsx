import { Container } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import EntityAvatar from '@/setting/im/components/EntityAvatar'
import getToolIcon from '@/utils/getToolIcon'

import { useModel } from '../context'
import { getFileIcon, getSkillTypeLabel } from '../utils'

import type { FC } from 'react'
import type { MentionItem } from '../types'

interface Props {
	items: Array<MentionItem>
	loading: boolean
	activeIndex: number
	onSelect: (item: MentionItem) => void
}

const Index: FC<Props> = ({ items, loading, activeIndex, onSelect }) => {
	const x = useModel()
	let cursor_index = -1

	return (
		<div
			className='
				flex flex-col
				rounded-lg
				bg-background/90
				border border-border-light
				backdrop-blur-md
			'
		>
			<div
				className='
					flex
					items-center justify-between
					px-3 pt-2.5
					pb-1
					text-xs
				'
			>
				<span className='text-std-600'>{x.mention_heading}</span>
				<span className='text-std-400'>{x.active_mention?.query || 'Type to search'}</span>
			</div>
			<div
				className='
					overflow-y-auto
					flex flex-col
					max-h-56
					gap-0.5
					p-1
				'
			>
				{loading ? (
					<div className='text-std-400 px-3 py-2 text-sm'>Loading...</div>
				) : items.length > 0 ? (
					x.mention_sections.map((section, section_index) => (
						<div className='flex flex-col gap-0.5' key={section.key}>
							{section_index > 0 && (
								<div className='border-border-light mx-2 my-1 border-t' />
							)}
							<div
								className='
										px-3 pt-1
										pb-0.5
										text-[10px] text-std-400 font-medium tracking-[0.08em]
										uppercase
									'
							>
								{section.key}
							</div>
							{section.items.map(item => {
								cursor_index += 1

								return (
									<button
										className={$cx(
											`
											flex flex-col
											w-full
											py-1
											pl-2.5 pr-1
											rounded-full
											text-left
											hover:bg-accent/60
										`,
											cursor_index === activeIndex && 'bg-accent/72'
										)}
										key={item.key}
										onMouseDown={e => e.preventDefault()}
										onClick={() => onSelect(item)}
									>
										{item.type === 'file' ? (
											<div
												className='
													flex
													items-center
													min-w-0
													gap-2
													px-1 py-0.5
												'
											>
												{(() => {
													const Icon = getFileIcon(item)

													return <Icon size={13} />
												})()}
												<span className='shrink-0 truncate text-sm font-medium'>
													{item.basename}
												</span>
												<span className='text-std-400 truncate text-xs'>
													{item.path}
												</span>
											</div>
										) : item.type === 'agent' ? (
											<div
												className='
														flex
														items-center
														w-full
														min-w-0
														gap-2
													'
											>
												<div className='-ml-1.5 flex'>
													<EntityAvatar
														name={item.label}
														photo={item.photo ?? null}
														avatar={item.avatar}
														size={20}
													/>
												</div>
												<span className='shrink-0 truncate text-sm font-medium'>
													{item.label}
												</span>
												<span className='text-std-500 shrink-0 truncate text-xs'>
													{item.role || 'Agent'}
												</span>
												<span className='text-std-300 flex-1 truncate text-xs'>
													{item.desc || 'No description'}
												</span>
											</div>
										) : item.type === 'tool' ? (
											<div
												className='
															flex
															items-center
															w-full
															min-w-0
															gap-2
														'
											>
												{(() => {
													const Icon = getToolIcon(item.label)

													return <Icon size={14} />
												})()}
												<span className='shrink-0 truncate text-sm font-medium'>
													{item.label}
												</span>
												<span className='text-std-400 flex-1 truncate text-xs'>
													{item.desc || 'No description'}
												</span>
												<span
													className='
																shrink-0
																px-2 py-0.5
																rounded-full
																text-[10px] text-std-500
																border
																border-border-light
															'
												>
													Tool
												</span>
											</div>
										) : (
											<div
												className='
															flex
															items-center
															w-full
															min-w-0
															gap-2
														'
											>
												<Container size={14} />
												<span className='shrink-0 truncate text-sm font-medium'>
													{item.label}
												</span>
												<span className='text-std-400 flex-1 truncate text-xs'>
													{item.desc || 'No description'}
												</span>
												<span
													className='
																shrink-0
																px-2 py-0.5
																rounded-full
																text-[10px] text-std-500
																border
																border-border-light
															'
												>
													{getSkillTypeLabel(item.skill_type)}
												</span>
											</div>
										)}
									</button>
								)
							})}
						</div>
					))
				) : (
					<div className='text-std-400 px-3 py-2 text-sm'>No matches found.</div>
				)}
			</div>
		</div>
	)
}

export default observer(Index)
