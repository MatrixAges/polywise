import Banner from '@website/appunits/index/Banner'
import Callback from '@website/appunits/index/Callback'
import Customers from '@website/appunits/index/Customers'
import Features from '@website/appunits/index/Features'
import Latest from '@website/appunits/index/Latest'
import LightTop from '@website/appunits/index/LightTop'
import Painpoint from '@website/appunits/index/Painpoint'
import WhyIF from '@website/appunits/index/WhyIF'

const Index = () => {
	return (
		<div className='flex w-full flex-col'>
			<Banner />
			<Customers />
			<LightTop />
			<WhyIF />
			<Painpoint />
			<Features />
			<Latest />
			<Callback />
		</div>
	)
}

export default Index
