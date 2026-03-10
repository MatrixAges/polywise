import { PGlite } from '@electric-sql/pglite'

import env from '../env'

export default new PGlite(env.pglite_data_dir)
