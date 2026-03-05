import { Spinner } from '@/__shadcn__/components/ui/spinner'

interface IProps {
	screen?: boolean
}

const Index = (props: IProps) => {
	const { screen } = props

	return (
		<div
			className={$cx(
				`
				flex
				items-center justify-center
				py-6
			`,
				screen ? 'h-screen w-screen' : 'h-full w-full'
			)}
		>
			<Spinner></Spinner>
		</div>
	)
}

export default $app.memo(Index)
