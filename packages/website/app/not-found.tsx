import { Link } from '@website/i18n/navigation'

export default function NotFound() {
	return (
		<div
			className='
				flex flex-col
				items-center justify-center
				w-full
				min-h-screen
				gap_6
			'
		>
			<h1>Page not found</h1>
			<Link href='/'>Back to home</Link>
		</div>
	)
}
