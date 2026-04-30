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
				index: true,
				lazy: () => import('@/pages/home')
			},
			{
				path: '/session',
				lazy: () => import('@/pages/session')
			},
			{
				path: '/todo',
				lazy: () => import('@/pages/todo')
			},
			{
				path: '/project',
				lazy: () => import('@/pages/project')
			},
			{
				path: '/workflow',
				lazy: () => import('@/pages/workflow')
			},
			{
				path: '/agent',
				lazy: () => import('@/pages/agent')
			},
			{
				path: '/linkcase',
				lazy: () => import('@/pages/linkcase')
			},
			{
				path: '/library',
				lazy: () => import('@/pages/library')
			},
			{
				path: '/database',
				lazy: () => import('@/pages/database')
			},
			{
				path: '/browser',
				lazy: () => import('@/pages/browser')
			},
			{
				path: '/setting',
				lazy: () => import('@/setting'),
				children: [
					{
						index: true,
						lazy: () => import('@/setting/general_setting')
					},
					{
						path: 'model_provider',
						lazy: () => import('@/setting/model_provider')
					},
					{
						path: 'model_setting',
						lazy: () => import('@/setting/model_setting')
					},
					{
						path: 'service_provider',
						lazy: () => import('@/setting/service_provider')
					},
					{
						path: 'about_feedback',
						lazy: () => import('@/setting/about_feedback')
					}
				]
			}
		],
		ErrorBoundary
	}
]

const router = is_electron ? createHashRouter(routes) : createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
