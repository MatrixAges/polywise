import Banner from '@website/appunits/index/Banner'
import Callback from '@website/appunits/index/Callback'
import Features from '@website/appunits/index/Features'
import Painpoint from '@website/appunits/index/Painpoint'
import WhyIF from '@website/appunits/index/WhyIF'

const Index = () => {
	return (
		<div className='flex w-full flex-col'>
			<Banner />
			<WhyIF />
			<Painpoint />
			<Features />
			<Callback />
		</div>
	)
}

export default Index
