import Banner from '@website/appunits/index/Banner'
import Callback from '@website/appunits/index/Callback'
import FAQ from '@website/appunits/index/FAQ'
import Features from '@website/appunits/index/Features'
import Painpoint from '@website/appunits/index/Painpoint'
import What from '@website/appunits/index/What'
import Why from '@website/appunits/index/Why'

const Index = () => {
	return (
		<div className='flex w-full flex-col'>
			<Banner />
			<What />
			{/* <Why />
			<Painpoint />
			<Features />
			<FAQ />
			<Callback /> */}
		</div>
	)
}

export default Index
