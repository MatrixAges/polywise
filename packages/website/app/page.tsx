import { default_locale } from '@website/app.config'
import { redirect } from 'next/navigation'

const Page = () => {
	redirect(`/${default_locale}`)
}

export default Page
