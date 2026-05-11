import { about } from '@/appdata'
import { version } from '@/package.json'
import Logo from '@/public/bare.svg?react'

const Index = () => {
	return (
		<div
			className='
				relative
				flex flex-col
				items-center justify-center
				w-full h-full
				page_wrap
			'
		>
			<div className='-mt-6 flex flex-col items-center'>
				<div
					className='
						flex
						items-center justify-center
						p-2
						mb-6
						rounded-xl
						border border-border-gray
						transition-all
						hover:fill-std-black
						fill-std-black
					'
					style={{ width: 60, height: 60 }}
				>
					<Logo width='100%' height='100%'></Logo>
				</div>

				<h1
					className='
						mb-2
						text-std-800 text-6xl font-bold tracking-wide
					'
				>
					Polywise
				</h1>
				<h2
					className='
						text-std-800 text-2xl font-medium
					'
				>
					agentic content system
				</h2>
			</div>
			<div
				className='
					absolute
					bottom-6
					flex flex-col
					items-center
					text-std-400
				'
			>
				<div
					className='
						flex flex-col
						items-center
						gap-1
						mb-4
						font-medium
					'
				>
					<div className='flex gap-3'>
						<a href={about.github} target='_blank'>
							Github
						</a>
						<a href={about.site} target='_blank'>
							Website
						</a>
						<a href={about.docs} target='_blank'>
							Docs
						</a>
						<a href={about.changelog} target='_blank'>
							Changelog
						</a>
					</div>
					<div className='flex gap-3'>
						<a href={about.issues} target='_blank'>
							Feedback
						</a>
						<a href={`mailto:${about.email}`} target='_blank'>
							Email
						</a>
						<a href={about.x} target='_blank'>
							X
						</a>
					</div>
				</div>
				<span className='font-mono text-sm'>v{version}</span>
			</div>
		</div>
	)
}

export const Component = $app.memo(Index)
