import { group_changelogs } from '@website/appdata/changelogs'
import { Mds } from '@website/appunits/changelog'
import { Link } from '@website/i18n/navigation'
import getMds from '@website/utils/getMds'

import styles from './index.module.css'

interface IProps {
	searchParams: { page: string }
}

const Index = async ({ searchParams }: IProps) => {
	const page = searchParams.page ? Number(searchParams.page) - 1 : 0
	const changelogs = group_changelogs[page]

	const mds = await getMds(
		'changelog',
		changelogs.map(item => item.id)
	)

	return (
		<div className={`small_content_wrap flex_column flex${styles._local}`}>
			<Mds changelogs={changelogs} mds={mds}></Mds>
			<div className='page_items flex justify-center'>
				{group_changelogs.map((_, index) => (
					<Link
						className={`page_item justify_center align_center flex${page === index ? 'active' : ''}`}
						href={`/changelog?page=${index + 1}`}
						key={index}
					>
						{index + 1}
					</Link>
				))}
			</div>
		</div>
	)
}

export default Index
