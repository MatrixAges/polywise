import MDContentPage from '@website/components/MDContentPage'
import getMd from '@website/utils/getMd'

interface IProps {
	params: Promise<{ id: string }>
	searchParams: { title: string }
}

const Index = async ({ params, searchParams }: IProps) => {
	const id = (await params).id
	const md = await getMd('blog', id)

	return <MDContentPage id={id} title={searchParams.title} md={md} hide_id></MDContentPage>
}

export default Index
