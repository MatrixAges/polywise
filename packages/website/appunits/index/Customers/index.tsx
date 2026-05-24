import { $ } from '@website/utils'

import styles from './index.module.css'

const customers = ['tencent', 'bytedance', 'innolux', 'vivo', 'microsoft', 'alibaba']

const Index = () => {
	return (
		<section className='limited_content_wrap section_wrap'>
			<div
				className={$.cx(
					`
					relative
					flex flex-col
					items-center
					w-full
				`,
					styles._local
				)}
			>
				<div className='image_mask absolute'></div>
				<div
					className='
						relative
						flex flex-wrap
						w-full
						customers_wrap
					'
				>
					{customers.map((item, index) => (
						<div className='img_customer_wrap box-border flex justify-center' key={index}>
							<img
								className='img_customer w-full'
								src={`/images/customers/${item}.png`}
								alt={item}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)
