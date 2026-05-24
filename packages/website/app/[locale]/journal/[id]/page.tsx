import MDContentPage from '@website/components/MDContentPage'
import getMd from '@website/utils/getMd'

interface IProps {
	params: Promise<{ id: string }>
	searchParams: { title: string }
}

const Index = async ({ params, searchParams }: IProps) => {
	const id = (await params).id
	const md = await getMd('journal', id)

	return <MDContentPage id={id} title={searchParams.title} md={md}></MDContentPage>
}

export default Index
