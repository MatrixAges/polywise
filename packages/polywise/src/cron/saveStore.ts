import { cron_path } from '@core/consts/app'
import { writeFile } from 'atomically'

import type { CronStore } from './types'

export default async (store: CronStore) => {
	await writeFile(cron_path, JSON.stringify(store, null, 4), 'utf8')
}
