import '@abraham/reflection'
import '@/presets'

import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom'

import { ErrorBoundary, Fallback } from '@/components'
import Layout from '@/layout'
import { is_electron } from '@/utils'

import type { RouteObject } from 'react-router-dom'

const routes: Array<RouteObject> = [
	{
		path: '/',
		element: <Layout />,
		hydrateFallbackElement: <Fallback />,
		children: [
			{
				path: '/',
				lazy: () => import('@/pages/search')
			},
			{
				path: '/agent',
				lazy: () => import('@/pages/agent')
			},
			{
				path: '/bookmark',
				lazy: () => import('@/pages/bookmark')
			},
			{
				path: '/notebook',
				lazy: () => import('@/pages/notebook')
			},
			{
				path: '/database',
				lazy: () => import('@/pages/database')
			},
			{
				path: '/project',
				lazy: () => import('@/pages/project')
			},
			{
				path: '/task',
				lazy: () => import('@/pages/task')
			},
			{
				path: '/browser',
				lazy: () => import('@/pages/browser')
			},
			{
				path: '/setting',
				lazy: () => import('@/setting')
			}
		],
		ErrorBoundary
	}
]

const router = is_electron ? createHashRouter(routes) : createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
