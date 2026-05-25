import Link from 'next/link'

const Index = () => {
	return (
		<div
			className='
				top-0
				left-0
				flex flex-col
				items-center justify-center
				w-screen h-screen
			'
			style={{ zIndex: 100000 }}
		>
			<h2>Not Found</h2>
			<p>Could not find requested resource</p>
			<Link href='/'>Return Home</Link>
		</div>
	)
}

export default Index
