import MDContentPage from '@website/components/MDContentPage'
import getResources from '@website/utils/getResources'

const Index = async () => {
	const md = await getResources('terms')

	return <MDContentPage id='Terms of Use' md={md}></MDContentPage>
}

export default Index
