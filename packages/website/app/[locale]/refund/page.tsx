import MDContentPage from '@website/components/MDContentPage'
import getResources from '@website/utils/getResources'

const Index = async () => {
	const md = await getResources('refund')

	return <MDContentPage id='Refund Policy' md={md}></MDContentPage>
}

export default Index
