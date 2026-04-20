import upsertPatchRecord from './upsertPatchRecord'

import type { TelemetryCollectArgs } from './types'

export default async (args: TelemetryCollectArgs & { has_existing_skill?: boolean }) => {
	return upsertPatchRecord(args)
}
