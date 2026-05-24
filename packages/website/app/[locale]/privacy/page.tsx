import MDContentPage from '@website/components/MDContentPage'
import getResources from '@website/utils/getResources'

const Index = async () => {
	const md = await getResources('privacy')

	return <MDContentPage id='Privacy Policy' md={md}></MDContentPage>
}

export default Index
