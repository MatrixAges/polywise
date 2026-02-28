import { BluetoothIcon } from 'lucide-react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/__shadcn__/components/ui/alert-dialog'
import { Button } from '@/__shadcn__/components/ui/button'

const Index = () => {
	return (
		<AlertDialog>
			<AlertDialogTrigger render={<Button variant='outline'>Show Dialog</Button>} />

			<AlertDialogContent size='sm'>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<BluetoothIcon />
					</AlertDialogMedia>
					<AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
					<AlertDialogDescription>
						Do you want to allow the USB accessory to connect to this device?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
					<AlertDialogAction>Allow</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default $app.memo(Index)
