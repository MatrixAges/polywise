import type { AlertArgs } from '@/layout/components/Alert'

export default async (args: AlertArgs) => {
	return $app.Event.emit('app/alert', args)
}
