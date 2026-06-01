import DocContentPage from '@website/components/DocContentPage'
import { $ } from '@website/utils'
import getDoc from '@website/utils/getDoc'

import styles from './index.module.css'

interface IProps {
	params: Promise<{ id: Array<string> }>
}

const Index = async ({ params }: IProps) => {
	const id = (await params).id
	const result = await getDoc(id.join('/'))
	const { err, md, toc } = result

	if (err) {
		return (
			<div
				className={$.cx(
					`
					flex
					items-center justify-center
					w-full h-screen
				`,
					styles._local
				)}
			>
				<div className='icon_wrap flex'>
					<img src='/svgs/404.svg' alt='Not found' />
				</div>
			</div>
		)
	}

	return <DocContentPage md={md} toc={toc!}></DocContentPage>
}

export default Index
