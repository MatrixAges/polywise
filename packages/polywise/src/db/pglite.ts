import { env } from '@core/env'
import { PGlite } from '@electric-sql/pglite'

export default new PGlite(env.pglite_data_dir)
