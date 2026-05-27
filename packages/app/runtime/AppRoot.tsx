import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Navigate, Outlet, useLocation } from 'react-router'
import { container } from 'tsyringe'

import { Fallback } from '@/components'
import { GlobalModel, GlobalProvider } from '@/context'
import { is_electron } from '@/utils'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))
	const { pathname } = useLocation()
	const auth = global.auth

	useEffect(() => {
		void global.init()

		return () => global.deinit()
	}, [global])

	if (!global.ready) {
		return <Fallback screen></Fallback>
	}

	let redirect_path = ''

	if (!is_electron && auth.bootstrapRequired) {
		if (pathname === '/login' || !pathname.startsWith('/setting')) {
			redirect_path = '/setting'
		}
	} else if (!is_electron && auth.requiresAuth) {
		if (!auth.authenticated) {
			if (pathname !== '/login') {
				redirect_path = '/login'
			}
		} else if (pathname === '/login') {
			redirect_path = '/'
		}
	} else if (pathname === '/login') {
		redirect_path = '/'
	}

	if (redirect_path) {
		return <Navigate to={redirect_path} replace></Navigate>
	}

	return (
		<GlobalProvider value={global}>
			<Outlet></Outlet>
		</GlobalProvider>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
