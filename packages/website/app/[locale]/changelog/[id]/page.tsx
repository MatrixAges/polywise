import MDContentPage from '@website/components/MDContentPage'
import Toc from '@website/components/Toc'
import getMd from '@website/utils/getMd'

interface IProps {
	params: Promise<{ id: string }>
	searchParams: { title: string }
}

const Index = async ({ params, searchParams }: IProps) => {
	const id = (await params).id
	const { md, toc } = await getMd('changelog', id, true)

	return (
		<MDContentPage id={id} id_prefix='v' title={searchParams.title} md={md}>
			<Toc list={toc} as_content></Toc>
		</MDContentPage>
	)
}

export default Index
