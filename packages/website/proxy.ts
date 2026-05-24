import { routing } from '@website/i18n/routing'
import createMiddleware from 'next-intl/middleware'

export default createMiddleware(routing)

export const config = {
	matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
}
