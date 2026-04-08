import path from 'path'

import getJobDir from './getJobDir'

export default (name: string) => path.resolve(getJobDir(name), 'JOB.md')
