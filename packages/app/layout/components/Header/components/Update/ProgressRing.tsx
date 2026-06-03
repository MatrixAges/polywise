interface IProps {
	percent: number
}

const Index = (props: IProps) => {
	const { percent } = props
	const safe_percent = Math.max(0, Math.min(100, Math.floor(percent)))

	return (
		<div
			className='
				relative
				flex
				items-center justify-center
				w-7 h-7
			'
		>
			<svg viewBox='0 0 24 24' className='h-7 w-7 -rotate-90'>
				<circle cx='12' cy='12' r='9' strokeWidth='2' className='stroke-under/16 fill-none'></circle>
				<circle
					cx='12'
					cy='12'
					r='9'
					strokeWidth='2'
					pathLength='100'
					strokeLinecap='round'
					strokeDasharray={`${safe_percent} 100`}
					className='fill-none stroke-emerald-500 transition-all duration-200'
				></circle>
			</svg>
			<span
				className='
					absolute
					top-[8.5px]
					text-[8px] text-under/72 font-medium font-mono
				'
			>
				{safe_percent}
			</span>
		</div>
	)
}

export default $app.memo(Index)
